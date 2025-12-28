package com.kurei.audiosync

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer

class NetworkSender {
    private var udpSocket: DatagramSocket? = null
    private var tcpSocket: java.net.Socket? = null
    private var tcpOutputStream: java.io.OutputStream? = null
    
    private var address: InetAddress? = null
    private var port: Int = 0
    private var sequenceNumber = 0
    private var isTcp = false

    fun connect(ip: String, port: Int) {
        try {
            this.address = InetAddress.getByName(ip)
            this.port = port
            
            // Auto-switch to TCP for USB Tethering (Localhost)
            if (ip == "127.0.0.1" || ip == "localhost") {
                isTcp = true
                // We will launch a connection attempt in background
            } else {
                isTcp = false
                udpSocket = DatagramSocket()
                Log.d("NetworkSender", "UDP Socket created to $ip:$port")
            }
        } catch (e: Exception) {
            Log.e("NetworkSender", "Error init", e)
        }
    }

    suspend fun sendAudio(pcmData: ByteArray, length: Int) = withContext(Dispatchers.IO) {
        try {
            // Lazy Connect for TCP to avoid MainThread Network ops
            if (isTcp) {
                if (tcpSocket == null || tcpSocket!!.isClosed) {
                    try {
                        Log.d("NetworkSender", "Connecting TCP to 127.0.0.1:$port...")
                        tcpSocket = java.net.Socket(address, port)
                        tcpSocket?.tcpNoDelay = true // Disable Nagle's algorithm for low latency
                        tcpOutputStream = tcpSocket!!.getOutputStream()
                        Log.d("NetworkSender", "TCP Connected")
                    } catch (e: Exception) {
                        Log.e("NetworkSender", "TCP Connect failed: ${e.message}")
                        return@withContext
                    }
                }
            }

            // Prepare Data
            // Header: Sequence (4 bytes) + Timestamp (8 bytes) = 12 bytes
            val headerSize = 12
            val packetSize = headerSize + length
            val buffer = ByteBuffer.allocate(packetSize)

            buffer.putInt(sequenceNumber++)
            buffer.putLong(System.currentTimeMillis())
            buffer.put(pcmData, 0, length)
            val data = buffer.array()

            // Send
            if (isTcp) {
                // TCP Framing: [Length 4 bytes] [Payload N bytes]
                val lenBuf = ByteBuffer.allocate(4)
                lenBuf.putInt(data.size)
                
                tcpOutputStream?.write(lenBuf.array())
                tcpOutputStream?.write(data)
                tcpOutputStream?.flush() // Force send immediately
            } else {
                // UDP
                if (udpSocket != null && address != null) {
                    val packet = DatagramPacket(data, data.size, address, port)
                    udpSocket?.send(packet)
                }
            }

            if (sequenceNumber % 100 == 0) {
                 Log.d("NetworkSender", "Sent packet #$sequenceNumber (${if(isTcp) "TCP" else "UDP"})")
            }
        } catch (e: Exception) {
            Log.e("NetworkSender", "Send error", e)
            // If TCP error, close to force reconnect next time
            if (isTcp) {
                try { tcpSocket?.close() } catch(e: Exception){}
                tcpSocket = null
            }
        }
    }

    fun close() {
        try {
            udpSocket?.close()
            udpSocket = null
            
            tcpSocket?.close()
            tcpSocket = null
            tcpOutputStream = null
            
            sequenceNumber = 0
        } catch (e: Exception) {
            Log.e("NetworkSender", "Error closing", e)
        }
    }
}
