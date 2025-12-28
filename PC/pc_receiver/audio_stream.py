import socket
import pyaudio
import threading
import struct
import collections
import time
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

class AudioReceiver:
    def __init__(self, port=50005, callback_status=None):
        self.port = port
        self.callback_status = callback_status
        self.running = False
        self.socket = None
        self.pyaudio_instance = pyaudio.PyAudio()
        self.stream = None
        
        # Audio Config
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 2
        self.RATE = 48000
        self.CHUNK = 1024 # Not strictly used for read, but for PyAudio buffer
        
        # Buffer
        # We use a deque as a jitter buffer
        self.audio_queue = collections.deque() 
        self.max_queue_size = 10 # Packets. ~10ms each typical. 10 * 10ms = 100ms buffer max.
        
        self.last_sequence = -1
        self.total_packets_received = 0
        self.packets_lost = 0
        
    def get_output_devices(self):
        # Refresh PyAudio to seeing new devices/defaults
        if not self.running and self.pyaudio_instance:
             self.pyaudio_instance.terminate()
        self.pyaudio_instance = pyaudio.PyAudio()

        devices = []
        info = self.pyaudio_instance.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        for i in range(0, numdevices):
            if (self.pyaudio_instance.get_device_info_by_host_api_device_index(0, i).get('maxOutputChannels')) > 0:
                name = self.pyaudio_instance.get_device_info_by_host_api_device_index(0, i).get('name')
                devices.append(f"{i}: {name}")
        return devices

    def start(self, device_index=None, protocol='udp', password=None):
        if self.running:
            return

        self.protocol = protocol
        
        # Setup Encryption if password provided
        self.cipher = None
        if password and len(password) > 0:
            salt = b"AudioStreamSalt" # Fixed salt for simplicity, or sync it. Ideally random but detailed protocol needed. For now fixed.
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = kdf.derive(password.encode())
            self.cipher = AESGCM(key)
            if self.callback_status:
                self.callback_status("Encryption Enabled (AES-GCM-256)")
        
        try:
            # Refresh PyAudio instance logic
            if self.pyaudio_instance:
                 self.pyaudio_instance.terminate()
            self.pyaudio_instance = pyaudio.PyAudio()

            if self.protocol == 'tcp':
                self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                self.server_socket.bind(('0.0.0.0', self.port))
                self.server_socket.listen(1)
                self.server_socket.settimeout(1.0) # check running flag
                self.socket = None # Client socket will be assigned later
            else:
                self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                self.socket.bind(('0.0.0.0', self.port))
                self.socket.settimeout(1.0) 

        except Exception as e:
            if self.callback_status:
                self.callback_status(f"Error binding port {self.port}: {e}")
            return

        self.running = True
        
        # Start Audio Stream
        kwargs = {
            'format': self.FORMAT,
            'channels': self.CHANNELS,
            'rate': self.RATE,
            'output': True,
            'frames_per_buffer': self.CHUNK
        }
        if device_index is not None:
            kwargs['output_device_index'] = device_index
            
        self.stream = self.pyaudio_instance.open(**kwargs)
        
        # Threads
        self.receive_thread = threading.Thread(target=self._receive_loop)
        self.play_thread = threading.Thread(target=self._play_loop)
        
        self.receive_thread.start()
        self.play_thread.start()
        
        if self.callback_status:
            proto_str = "TCP" if self.protocol == 'tcp' else "UDP"
            base_msg = f"Listening on port {self.port} ({proto_str})..."
            if self.cipher:
                base_msg += " [ENCRYPTED]"
            self.callback_status(base_msg)

    def stop(self):
        self.running = False
        
        # Close sockets
        if self.protocol == 'tcp':
            if getattr(self, 'server_socket', None):
                try: self.server_socket.close() 
                except: pass
            if self.socket: # Client socket
                try: self.socket.close()
                except: pass
        else:
            if self.socket:
                try: self.socket.close()
                except: pass
        
        # Threads will join naturally via running check or exception
        
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            
        if self.pyaudio_instance:
            self.pyaudio_instance.terminate()
            
        if self.callback_status:
            self.callback_status("Stopped.")

    def _recv_all(self, sock, count):
        buf = b''
        while count:
            newbuf = sock.recv(count)
            if not newbuf: return None
            buf += newbuf
            count -= len(newbuf)
        return buf

    def _receive_loop(self):
        while self.running:
            try:
                if self.protocol == 'tcp':
                    # Accept connection if not connected
                    if not self.socket:
                        try:
                            client, addr = self.server_socket.accept()
                            client.settimeout(None) # Disable timeout for client to prevent receive desync
                            client.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1) # Low latency
                            self.socket = client
                            if self.callback_status: self.callback_status(f"Connected: {addr}")
                        except socket.timeout:
                            continue
                        except Exception as e:
                            print(f"Accept error: {e}")
                            continue
                    
                    # Read Framing (4 bytes length)
                    length_bytes = self._recv_all(self.socket, 4)
                    if not length_bytes:
                        # Disconnected
                        self.socket.close()
                        self.socket = None
                        if self.callback_status: self.callback_status("Disconnected (EOF). Waiting...")
                        return # Restart loop? No, continue outer loop
                        # Note: `continue` here works because we reset self.socket to None
                        
                    length = struct.unpack('>I', length_bytes)[0]
                    # print(f"DEBUG: Frame Len {length}") # Uncomment to debug packet sizes
                    
                    # Read Payload
                    data = self._recv_all(self.socket, length)
                    if not data:
                        # Payload EOF?
                        self.socket.close()
                        self.socket = None
                        print("Disconnected during payload read")
                        continue  

                else:
                    # UDP Mode
                    # Increased buffer size to 65535 to handle large packets (e.g. 7692 bytes from Android)
                    data, addr = self.socket.recvfrom(65535) 

                # DECRYPTION STEP
                if self.cipher:
                    try:
                        # EXPECTED FORMAT: Nonce(12) + Ciphertext + Tag(16)
                        # Packet overhead: 28 bytes
                        if len(data) < 28: 
                            continue # Too short for encrypted packet
                            
                        nonce = data[:12]
                        ciphertext = data[12:]
                        # AESGCM.decrypt expects ciphertext + tag
                        data = self.cipher.decrypt(nonce, ciphertext, None)
                    except Exception as e:
                        # Decryption failed (wrong password? corruption?)
                        # print(f"Decryption Error: {e}") 
                        continue

                # Parse AudioStream Header (12 bytes: Seq + Timestamp)
                if len(data) < 12:
                    continue # Bad packet
                
                # Parse header
                seq_bytes = data[0:4]
                # timestamp_bytes = data[4:12] 
                audio_data = data[12:]
                
                seq = struct.unpack('>I', seq_bytes)[0]
                
                # Basic packet loss tracking
                if self.last_sequence != -1:
                    diff = seq - self.last_sequence
                    if diff > 1:
                        self.packets_lost += (diff - 1)
                
                self.last_sequence = seq
                self.total_packets_received += 1
                
                # Add to queue
                queue_limit = self.max_queue_size
                if self.protocol == 'tcp':
                     # For TCP, we want minimal latency. The 'jitter buffer' is harmful.
                     # We only keep 1-2 packets max.
                     queue_limit = 2

                if len(self.audio_queue) < queue_limit:
                    self.audio_queue.append(audio_data)
                else:
                    # Buffer full - clear some old data to catch up (minimize latency)
                    # Dropping oldest packet
                    self.audio_queue.popleft() 
                    self.audio_queue.append(audio_data)
                    
            except socket.timeout:
                continue
            except OSError:
                break # Socket closed
            except Exception as e:
                print(f"Receive Error: {e}")
                # Reset TCP socket on error
                if self.protocol == 'tcp' and self.socket:
                    self.socket.close()
                    self.socket = None

    def _play_loop(self):
        while self.running:
            if self.audio_queue:
                data = self.audio_queue.popleft()
                try:
                    self.stream.write(data)
                except Exception as e:
                    print(f"Write Error: {e}")
            else:
                # Buffer empty? Wait a tiny bit (underrun)
                # We could send silence, but write blocks if we wanted to flow control
                # Here we just spin lightly to avoid 100% CPU if empty
                time.sleep(0.001)

    def get_stats(self):
        return {
            "received": self.total_packets_received,
            "lost": self.packets_lost,
            "queue": len(self.audio_queue)
        }
