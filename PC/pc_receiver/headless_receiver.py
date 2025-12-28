import sys
import json
import time
import threading
import socket
import subprocess
import os

# Redirect standard output to stderr so that existing print() statements 
# (logs/errors) don't interfere with our JSON IPC on the original stdout.
# We will use 'ipc_out' to send structured JSON data to the parent process.
ipc_out = sys.stdout
sys.stdout = sys.stderr

try:
    from audio_stream import AudioReceiver
except ImportError:
    # If run from a different CWD, adjust path or handle error
    sys.stderr.write("Error importing audio_stream. Ensure you run this from the proper directory.\n")
    sys.exit(1)

try:
    from volume_control import AudioSyncVolumeControl
except ImportError:
    sys.stderr.write("Volume control module missing.\n")
    AudioSyncVolumeControl = None

class HeadlessController:
    def __init__(self):
        self.receiver = None
        self.monitor_running = False
        self.monitor_thread = None
        if AudioSyncVolumeControl:
            # Check if running as a bundled executable (Prod) or script (Dev)
            if getattr(sys, 'frozen', False):
                target = "AudioSync.exe"
            else:
                target = "python.exe"
            self.vol_control = AudioSyncVolumeControl(target_process=target)
        else:
            self.vol_control = None

    def send_event(self, event_type, data):
        """Send a JSON event to the parent process."""
        try:
            message = json.dumps({"type": event_type, "data": data})
            ipc_out.write(message + "\n")
            ipc_out.flush()
        except Exception as e:
            sys.stderr.write(f"Error sending event: {e}\n")

    def status_callback(self, message):
        self.send_event("status", message)

    def get_devices(self):
        try:
            temp = AudioReceiver()
            devices = temp.get_output_devices()
            temp.stop()
            self.send_event("devices", devices)
        except Exception as e:
            self.send_event("error", f"Error listing devices: {str(e)}")

    def start_receiver(self, port, device_index=None, buffer_ms=100, protocol='udp', password=None):
        if self.receiver and self.receiver.running:
            self.stop_receiver()
        
        try:
            self.receiver = AudioReceiver(port=port, callback_status=self.status_callback)
            
            # Set buffer size (approx 10ms per packet)
            # buffer_ms / 10 = queue size
            queue_size = max(1, int(buffer_ms / 10))
            self.receiver.max_queue_size = queue_size
            
            self.receiver.start(device_index=device_index, protocol=protocol, password=password)
            
            if self.receiver.running:
                self.monitor_running = True
                self.monitor_thread = threading.Thread(target=self._stats_loop, daemon=True)
                self.monitor_thread.start()
                self.send_event("state", "running")
            else:
                self.send_event("error", "Failed to start receiver (unknown reason)")
                
        except Exception as e:
            self.send_event("error", f"Exception starting receiver: {str(e)}")

    def stop_receiver(self):
        self.monitor_running = False
        if self.receiver:
            self.receiver.stop()
            self.receiver = None
        self.send_event("state", "stopped")

    def _stats_loop(self):
        while self.monitor_running and self.receiver and self.receiver.running:
            try:
                stats = self.receiver.get_stats()
                # stats: {'received', 'lost', 'queue'}
                self.send_event("stats", stats)
                time.sleep(0.5)
            except Exception as e:
                sys.stderr.write(f"Stats loop error: {e}\n")

    def _get_lan_ip(self):
        """Get the best LAN IP address by checking all interfaces."""
        try:
            # Method 1: Connect to external address (doesn't actually send data)
            # This usually picks the right interface
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0)
            try:
                s.connect(('10.254.254.254', 1))  # Dummy address
                ip = s.getsockname()[0]
            except Exception:
                ip = '127.0.0.1'
            finally:
                s.close()
            
            # Check if we got a private IP
            if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                return ip
            
            # Method 2: Fallback to hostname resolution
            hostname = socket.gethostname()
            for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
                addr = info[4][0]
                if addr.startswith('192.168.') or addr.startswith('10.') or addr.startswith('172.'):
                    return addr
            
            return ip  # Return whatever we got
        except Exception:
            return '127.0.0.1'

    def process_command(self, cmd_line):
        try:
            if not cmd_line: return
            msg = json.loads(cmd_line)
            command = msg.get("command")
            payload = msg.get("payload", {})
            
            if command == "get_devices":
                self.get_devices()
            elif command == "start":
                port = int(payload.get("port", 50005))
                dev_idx = payload.get("device_index")
                if dev_idx == -1: dev_idx = None # Default
                buffer_ms = int(payload.get("buffer_ms", 100))
                protocol = payload.get("protocol", "udp")
                password = payload.get("password")
                self.start_receiver(port, dev_idx, buffer_ms, protocol, password)
            elif command == "stop":
                self.stop_receiver()
            elif command == "get_info":
                try:
                    hostname = socket.gethostname()
                    ip = self._get_lan_ip()
                    self.send_event("info", {"ip": ip, "hostname": hostname})
                except:
                    self.send_event("info", {"ip": "127.0.0.1", "hostname": "Unknown"})
            elif command == "ping":
                self.send_event("pong", time.time())
            elif command == "volume_up":
                if self.vol_control:
                    vol = self.vol_control.change_volume(0.05)
                    if vol is not None:
                        self.send_event("volume_level", vol)
            elif command == "volume_down":
                if self.vol_control:
                    vol = self.vol_control.change_volume(-0.05)
                    if vol is not None:
                        self.send_event("volume_level", vol)
            elif command == "mute_toggle":
                if self.vol_control:
                    muted = self.vol_control.toggle_mute()
                    if muted is not None:
                        self.send_event("mute_state", muted)
                
        except json.JSONDecodeError:
            sys.stderr.write(f"Invalid JSON received: {cmd_line}\n")
        except Exception as e:
            self.send_event("error", f"Command processing error: {str(e)}")

    def run(self):
        sys.stderr.write("Headless Receiver Started. Waiting for input...\n")
        self.send_event("ready", True)
        
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                self.process_command(line.strip())
            except KeyboardInterrupt:
                break
        
        self.stop_receiver()

if __name__ == "__main__":
    controller = HeadlessController()
    controller.run()
