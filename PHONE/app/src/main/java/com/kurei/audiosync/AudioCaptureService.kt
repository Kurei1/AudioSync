package com.kurei.audiosync

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class AudioCaptureService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_STOPPED = "com.example.audiostream.ACTION_STOPPED"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_DATA = "EXTRA_DATA"
        const val EXTRA_IP = "EXTRA_IP"
        const val EXTRA_PORT = "EXTRA_PORT"
        private const val CHANNEL_ID = "AudioStreamChannel"
        private const val NOTIFICATION_ID = 1
    }

    private var mediaProjectionManager: MediaProjectionManager? = null
    private var mediaProjection: MediaProjection? = null
    private var audioRecord: AudioRecord? = null
    private var networkSender: NetworkSender? = null
    private var serviceJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO)

    // Audio Settings
    private val SAMPLE_RATE = 48000
    private val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_STEREO
    private val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    private val BUFFER_SIZE_FACTOR = 2 // Small buffer for low latency
    
    // Notification timer
    private val notificationHandler = Handler(Looper.getMainLooper())
    private var streamingStartTime: Long = 0
    private var targetIp: String = ""
    private var targetPort: Int = 0
    
    private val notificationUpdateRunnable = object : Runnable {
        override fun run() {
            updateNotification()
            notificationHandler.postDelayed(this, 1000)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_DATA)
                val ip = intent.getStringExtra(EXTRA_IP) ?: return START_NOT_STICKY
                val port = intent.getIntExtra(EXTRA_PORT, 50005)
                
                targetIp = ip
                targetPort = port
                streamingStartTime = System.currentTimeMillis()

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val notification = createNotification()
                    if (Build.VERSION.SDK_INT >= 34) {
                         startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
                    } else {
                         startForeground(NOTIFICATION_ID, notification)
                    }
                    
                    // Start notification timer updates
                    notificationHandler.post(notificationUpdateRunnable)
                    
                    if (resultData != null) {
                        startCapture(resultCode, resultData, ip, port)
                    }
                }
            }
            ACTION_STOP -> {
                stopCapture()
                notificationHandler.removeCallbacks(notificationUpdateRunnable)
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startCapture(resultCode: Int, resultData: Intent, ip: String, port: Int) {
        mediaProjection = mediaProjectionManager?.getMediaProjection(resultCode, resultData)
        val projection = mediaProjection ?: return
        
        val config = AudioPlaybackCaptureConfiguration.Builder(projection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_GAME)
            .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setEncoding(AUDIO_FORMAT)
            .setSampleRate(SAMPLE_RATE)
            .setChannelMask(CHANNEL_CONFIG)
            .build()

        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val bufferSize = minBufferSize * BUFFER_SIZE_FACTOR

        try {
            audioRecord = AudioRecord.Builder()
                .setAudioFormat(audioFormat)
                .setBufferSizeInBytes(bufferSize)
                .setAudioPlaybackCaptureConfig(config)
                .build()

            audioRecord?.startRecording()
            
            networkSender = NetworkSender()
            networkSender?.connect(ip, port)

            serviceJob = serviceScope.launch {
                val buffer = ByteArray(minBufferSize) 
                Log.d("AudioCaptureService", "Starting captured loop. MinBufferSize: $minBufferSize")
                while (isActive && audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        networkSender?.sendAudio(buffer, read)
                    } else {
                        Log.w("AudioCaptureService", "AudioRecord read returned: $read")
                    }
                }
                Log.d("AudioCaptureService", "Capture loop ended. isActive=$isActive, state=${audioRecord?.recordingState}")
            }
        } catch (e: Exception) {
            Log.e("AudioCaptureService", "Error starting capture", e)
            stopCapture()
        }
    }

    private fun stopCapture() {
        serviceJob?.cancel()
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            // Ignore format errors on stop
        }
        mediaProjection?.stop()
        networkSender?.close()
        
        mediaProjection = null
        audioRecord = null
        networkSender = null

        // Broadcast stop event
        val broadcastIntent = Intent(ACTION_STOPPED)
        broadcastIntent.setPackage(packageName)
        sendBroadcast(broadcastIntent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Audio Streaming",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when audio is being streamed to PC"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return buildNotification()
    }
    
    private fun updateNotification() {
        val notification = buildNotification()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun buildNotification(): Notification {
        // Calculate streaming duration
        val elapsed = System.currentTimeMillis() - streamingStartTime
        val seconds = (elapsed / 1000) % 60
        val minutes = (elapsed / 1000 / 60) % 60
        val hours = elapsed / 1000 / 60 / 60
        
        val timeString = if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%02d:%02d", minutes, seconds)
        }
        
        // Intent to open main activity
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenIntent = PendingIntent.getActivity(
            this, 0, openIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Intent to stop streaming
        val stopIntent = Intent(this, AudioCaptureService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStopIntent = PendingIntent.getService(
            this, 1, stopIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create custom notification view
        val customView = RemoteViews(packageName, R.layout.notification_streaming)
        customView.setTextViewText(R.id.notification_title, "🎵 Audio Stream Active")
        customView.setTextViewText(R.id.notification_content, "Streaming to $targetIp:$targetPort")
        customView.setTextViewText(R.id.notification_timer, timeString)
        customView.setOnClickPendingIntent(R.id.stop_button_container, pendingStopIntent)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_streaming)
            .setColor(Color.parseColor("#00B4D8"))
            .setColorized(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingOpenIntent)
            .setCustomContentView(customView)
            .setCustomBigContentView(customView)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .build()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        notificationHandler.removeCallbacks(notificationUpdateRunnable)
    }
}
