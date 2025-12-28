package com.kurei.audiosync

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.LinearGradient
import android.graphics.Shader
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.util.Locale
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.media.AudioManager
import android.content.BroadcastReceiver
import android.content.IntentFilter

class MainActivity : AppCompatActivity() {

    // Tab views
    private lateinit var tabUsb: TextView
    private lateinit var tabWifi: TextView
    private lateinit var tabBluetooth: TextView
    
    // Content containers
    private lateinit var contentUsb: ScrollView
    private lateinit var contentWifi: ScrollView
    private lateinit var contentBluetooth: ScrollView
    
    // USB controls
    private lateinit var usbPortInput: EditText
    private lateinit var usbMuteCheckbox: CheckBox
    private lateinit var usbStartBtn: Button
    private lateinit var usbStatusText: TextView
    private lateinit var usbStreamingTimer: TextView
    
    // WiFi controls
    private lateinit var wifiIpInput: EditText
    private lateinit var wifiPortInput: EditText
    private lateinit var wifiMuteCheckbox: CheckBox
    private lateinit var wifiStartBtn: Button
    private lateinit var wifiStatusText: TextView
    private lateinit var wifiStreamingTimer: TextView
    
    // Header
    private lateinit var txtVersion: TextView
    private lateinit var btnHelp: TextView
    private lateinit var btnLanguage: TextView
    
    private lateinit var mediaProjectionManager: MediaProjectionManager
    private lateinit var sharedPrefs: SharedPreferences
    
    private val PERMISSION_CODE = 100
    private val SCREEN_CAPTURE_REQUEST_CODE = 200
    
    private val PREFS_NAME = "AudioStreamPrefs"
    private val KEY_WIFI_IP = "wifi_ip"
    private val KEY_WIFI_PORT = "wifi_port"
    private val KEY_USB_PORT = "usb_port"
    private val KEY_WIFI_MUTE = "wifi_mute"
    private val KEY_USB_MUTE = "usb_mute"
    private val KEY_SELECTED_TAB = "selected_tab"
    private val KEY_LANGUAGE = "app_language"
    
    private val USB_TETHERING_IP = "192.168.42.129"

    private lateinit var audioManager: AudioManager
    private var savedVolume: Int = -1

    private var isStreaming = false
    private var currentMode = "usb" // "usb", "wifi", or "bluetooth"
    private var pendingStreamMode = "" // To track which mode initiated the stream
    
    // Timer for streaming duration
    private val timerHandler = Handler(Looper.getMainLooper())
    private var streamingStartTime: Long = 0
    private val timerRunnable = object : Runnable {
        override fun run() {
            if (isStreaming) {
                val elapsed = System.currentTimeMillis() - streamingStartTime
                val seconds = (elapsed / 1000) % 60
                val minutes = (elapsed / 1000 / 60) % 60
                val hours = elapsed / 1000 / 60 / 60
                
                val timeString = if (hours > 0) {
                    String.format("%d:%02d:%02d", hours, minutes, seconds)
                } else {
                    String.format("%02d:%02d", minutes, seconds)
                }
                
                usbStreamingTimer.text = getString(R.string.streaming_for, timeString)
                wifiStreamingTimer.text = getString(R.string.streaming_for, timeString)
                
                timerHandler.postDelayed(this, 1000)
            }
        }
    }

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioCaptureService.ACTION_STOPPED) {
                handleServiceStopped()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize SharedPreferences
        sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        // Apply saved language BEFORE setting content view
        val savedLang = sharedPrefs.getString(KEY_LANGUAGE, "en") ?: "en"
        setAppLocale(savedLang)

        // Register receiver
        val filter = IntentFilter(AudioCaptureService.ACTION_STOPPED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(receiver, filter)
        }

        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        
        // Now set content view
        setContentView(R.layout.activity_main)

        initViews()
        setupTabs()
        setupControls()
        restorePreferences()

        // Setup Header Actions
        setupHeaderActions(savedLang)
        
        // Restore selected tab
        val savedTab = sharedPrefs.getString(KEY_SELECTED_TAB, "usb") ?: "usb"
        selectTab(savedTab, animate = false)
    }

    private fun setAppLocale(localeCode: String) {
        val locale = Locale(localeCode)
        Locale.setDefault(locale)
        val config = Configuration()
        config.setLocale(locale)
        
        // Ensure standard numbers (ltr) for Arabic if needed, 
        // usually standard Arabic locale uses standard digits but layout is RTL.
        if (localeCode == "ar") {
            config.setLayoutDirection(locale)
        } else {
            config.setLayoutDirection(Locale.ENGLISH)
        }

        baseContext.resources.updateConfiguration(config, baseContext.resources.displayMetrics)
    }

    private fun initViews() {
        // Header
        txtVersion = findViewById(R.id.txtVersion)
        btnHelp = findViewById(R.id.btnHelp)
        btnLanguage = findViewById(R.id.btnLanguage)
        
        // Tabs
        tabUsb = findViewById(R.id.tabUsb)
        tabWifi = findViewById(R.id.tabWifi)
        tabBluetooth = findViewById(R.id.tabBluetooth)
        
        // Content containers
        contentUsb = findViewById(R.id.contentUsb)
        contentWifi = findViewById(R.id.contentWifi)
        contentBluetooth = findViewById(R.id.contentBluetooth)
        
        // USB controls
        usbPortInput = findViewById(R.id.usbPortInput)
        usbMuteCheckbox = findViewById(R.id.usbMuteCheckbox)
        usbStartBtn = findViewById(R.id.usbStartBtn)
        usbStatusText = findViewById(R.id.usbStatusText)
        usbStreamingTimer = findViewById(R.id.usbStreamingTimer)
        
        // WiFi controls
        wifiIpInput = findViewById(R.id.wifiIpInput)
        wifiPortInput = findViewById(R.id.wifiPortInput)
        wifiMuteCheckbox = findViewById(R.id.wifiMuteCheckbox)
        wifiStartBtn = findViewById(R.id.wifiStartBtn)
        wifiStatusText = findViewById(R.id.wifiStatusText)
        wifiStreamingTimer = findViewById(R.id.wifiStreamingTimer)
    }
    
    private fun setupHeaderActions(savedLang: String) {
        // Version
        try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            txtVersion.text = "v${packageInfo.versionName}"
        } catch (e: Exception) {
            txtVersion.text = "v1.1"
        }

        // Help Button
        btnHelp.setOnClickListener {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = android.net.Uri.parse("mailto:")
                putExtra(Intent.EXTRA_EMAIL, arrayOf("audio.sync.2025@gmail.com"))
                putExtra(Intent.EXTRA_SUBJECT, "AudioSync Android Support")
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "No email app found", Toast.LENGTH_SHORT).show()
            }
        }

        // Language Button
        btnLanguage.setOnClickListener {
            val currentLang = sharedPrefs.getString(KEY_LANGUAGE, "en") ?: "en"
            val newLang = if (currentLang == "en") "ar" else "en"
            
            // Save new language
            sharedPrefs.edit().putString(KEY_LANGUAGE, newLang).apply()
            
            // Apply and recreate
            setAppLocale(newLang)
            recreate()
        }
    }
    
    private fun setupTabs() {
        tabUsb.setOnClickListener { 
            if (currentMode != "usb") {
                selectTab("usb", animate = true)
                saveSelectedTab("usb")
            }
        }
        tabWifi.setOnClickListener { 
            if (currentMode != "wifi") {
                selectTab("wifi", animate = true)
                saveSelectedTab("wifi")
            }
        }
        tabBluetooth.setOnClickListener { 
            if (currentMode != "bluetooth") {
                selectTab("bluetooth", animate = true)
                saveSelectedTab("bluetooth")
            }
        }
    }
    
    private fun selectTab(tab: String, animate: Boolean = true) {
        val previousMode = currentMode
        currentMode = tab
        
        // Reset all tabs to unselected
        tabUsb.background = ContextCompat.getDrawable(this, R.drawable.tab_background_unselected)
        tabWifi.background = ContextCompat.getDrawable(this, R.drawable.tab_background_unselected)
        tabBluetooth.background = ContextCompat.getDrawable(this, R.drawable.tab_background_unselected)
        
        tabUsb.setTextColor(ContextCompat.getColor(this, R.color.tab_inactive_text))
        tabWifi.setTextColor(ContextCompat.getColor(this, R.color.tab_inactive_text))
        tabBluetooth.setTextColor(ContextCompat.getColor(this, R.color.tab_inactive_text))
        
        tabUsb.setTypeface(null, android.graphics.Typeface.NORMAL)
        tabWifi.setTypeface(null, android.graphics.Typeface.NORMAL)
        tabBluetooth.setTypeface(null, android.graphics.Typeface.NORMAL)
        
        // Get content views
        val previousContent: View? = when (previousMode) {
            "usb" -> contentUsb
            "wifi" -> contentWifi
            "bluetooth" -> contentBluetooth
            else -> null
        }
        
        val newContent: View = when (tab) {
            "usb" -> contentUsb
            "wifi" -> contentWifi
            "bluetooth" -> contentBluetooth
            else -> contentUsb
        }
        
        // Select the active tab
        when (tab) {
            "usb" -> {
                tabUsb.background = ContextCompat.getDrawable(this, R.drawable.tab_background_selected)
                tabUsb.setTextColor(ContextCompat.getColor(this, R.color.white))
                tabUsb.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "wifi" -> {
                tabWifi.background = ContextCompat.getDrawable(this, R.drawable.tab_background_selected)
                tabWifi.setTextColor(ContextCompat.getColor(this, R.color.white))
                tabWifi.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "bluetooth" -> {
                tabBluetooth.background = ContextCompat.getDrawable(this, R.drawable.tab_background_selected)
                tabBluetooth.setTextColor(ContextCompat.getColor(this, R.color.white))
                tabBluetooth.setTypeface(null, android.graphics.Typeface.BOLD)
            }
        }
        
        // Animate content transition
        if (animate && previousContent != null && previousContent != newContent) {
            // Determine slide direction
            val slideOutX = if (getTabIndex(tab) > getTabIndex(previousMode)) -100f else 100f
            val slideInX = -slideOutX
            
            // Fade out and slide previous content
            val fadeOut = ObjectAnimator.ofFloat(previousContent, "alpha", 1f, 0f)
            val slideOut = ObjectAnimator.ofFloat(previousContent, "translationX", 0f, slideOutX)
            
            fadeOut.duration = 150
            slideOut.duration = 150
            
            val outSet = AnimatorSet()
            outSet.playTogether(fadeOut, slideOut)
            outSet.interpolator = AccelerateDecelerateInterpolator()
            
            outSet.addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    previousContent.visibility = View.GONE
                    previousContent.translationX = 0f
                    previousContent.alpha = 1f
                    
                    // Show and animate new content
                    newContent.alpha = 0f
                    newContent.translationX = slideInX
                    newContent.visibility = View.VISIBLE
                    
                    val fadeIn = ObjectAnimator.ofFloat(newContent, "alpha", 0f, 1f)
                    val slideIn = ObjectAnimator.ofFloat(newContent, "translationX", slideInX, 0f)
                    
                    fadeIn.duration = 200
                    slideIn.duration = 200
                    
                    val inSet = AnimatorSet()
                    inSet.playTogether(fadeIn, slideIn)
                    inSet.interpolator = AccelerateDecelerateInterpolator()
                    inSet.start()
                }
            })
            
            outSet.start()
        } else {
            // No animation, just show/hide
            contentUsb.visibility = View.GONE
            contentWifi.visibility = View.GONE
            contentBluetooth.visibility = View.GONE
            newContent.visibility = View.VISIBLE
        }
    }
    
    private fun getTabIndex(tab: String): Int {
        return when (tab) {
            "usb" -> 0
            "wifi" -> 1
            "bluetooth" -> 2
            else -> 0
        }
    }
    
    private fun setupControls() {
        // USB controls
        usbStartBtn.setOnClickListener {
            if (isStreaming) {
                stopStreaming()
            } else {
                if (validateUsbInput()) {
                    pendingStreamMode = "usb"
                    saveUsbPreferences()
                    checkPermissionsAndStart()
                }
            }
        }
        
        // WiFi controls
        wifiStartBtn.setOnClickListener {
            if (isStreaming) {
                stopStreaming()
            } else {
                if (validateWifiInput()) {
                    pendingStreamMode = "wifi"
                    saveWifiPreferences()
                    checkPermissionsAndStart()
                }
            }
        }
    }
    
    private fun validateUsbInput(): Boolean {
        val port = usbPortInput.text.toString()
        if (port.isEmpty()) {
            usbPortInput.error = "Enter Port"
            return false
        }
        return true
    }
    
    private fun validateWifiInput(): Boolean {
        if (wifiIpInput.text.toString().isEmpty()) {
            wifiIpInput.error = "Enter IP Address"
            return false
        }
        if (wifiPortInput.text.toString().isEmpty()) {
            wifiPortInput.error = "Enter Port"
            return false
        }
        return true
    }
    
    private fun saveUsbPreferences() {
        sharedPrefs.edit().apply {
            putString(KEY_USB_PORT, usbPortInput.text.toString())
            putBoolean(KEY_USB_MUTE, usbMuteCheckbox.isChecked)
            apply()
        }
    }
    
    private fun saveWifiPreferences() {
        sharedPrefs.edit().apply {
            putString(KEY_WIFI_IP, wifiIpInput.text.toString())
            putString(KEY_WIFI_PORT, wifiPortInput.text.toString())
            putBoolean(KEY_WIFI_MUTE, wifiMuteCheckbox.isChecked)
            apply()
        }
    }
    
    private fun saveSelectedTab(tab: String) {
        sharedPrefs.edit().putString(KEY_SELECTED_TAB, tab).apply()
    }
    
    private fun restorePreferences() {
        // Restore USB preferences - no default port
        val savedUsbPort = sharedPrefs.getString(KEY_USB_PORT, null)
        if (savedUsbPort != null) {
            usbPortInput.setText(savedUsbPort)
        }
        usbMuteCheckbox.isChecked = sharedPrefs.getBoolean(KEY_USB_MUTE, true)
        
        // Restore WiFi preferences - no default port
        val savedWifiIp = sharedPrefs.getString(KEY_WIFI_IP, null)
        val savedWifiPort = sharedPrefs.getString(KEY_WIFI_PORT, null)
        if (savedWifiIp != null) {
            wifiIpInput.setText(savedWifiIp)
        }
        if (savedWifiPort != null) {
            wifiPortInput.setText(savedWifiPort)
        }
        wifiMuteCheckbox.isChecked = sharedPrefs.getBoolean(KEY_WIFI_MUTE, true)
    }

    override fun onDestroy() {
        super.onDestroy()
        timerHandler.removeCallbacks(timerRunnable)
        try {
            unregisterReceiver(receiver)
        } catch (e: Exception) {
            // Receiver not registered
        }
    }

    private fun checkPermissionsAndStart() {
        val permissions = mutableListOf(android.Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERMISSION_CODE)
        } else {
            startMediaProjectionRequest()
        }
    }

    private fun startMediaProjectionRequest() {
        startActivityForResult(mediaProjectionManager.createScreenCaptureIntent(), SCREEN_CAPTURE_REQUEST_CODE)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                startMediaProjectionRequest()
            } else {
                Toast.makeText(this, "Permissions denied", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SCREEN_CAPTURE_REQUEST_CODE) {
            if (resultCode == RESULT_OK && data != null) {
                startStreamingService(resultCode, data)
            } else {
                Toast.makeText(this, "Screen capture permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun startStreamingService(resultCode: Int, data: Intent) {
        val ip: String
        val port: Int
        val shouldMute: Boolean
        
        when (pendingStreamMode) {
            "usb" -> {
                ip = USB_TETHERING_IP
                port = usbPortInput.text.toString().toIntOrNull() ?: 50005
                shouldMute = usbMuteCheckbox.isChecked
            }
            "wifi" -> {
                ip = wifiIpInput.text.toString()
                port = wifiPortInput.text.toString().toIntOrNull() ?: 50005
                shouldMute = wifiMuteCheckbox.isChecked
            }
            else -> {
                Toast.makeText(this, "Invalid mode", Toast.LENGTH_SHORT).show()
                return
            }
        }

        if (shouldMute) {
            savedVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0)
        }

        val serviceIntent = Intent(this, AudioCaptureService::class.java).apply {
            action = AudioCaptureService.ACTION_START
            putExtra(AudioCaptureService.EXTRA_RESULT_CODE, resultCode)
            putExtra(AudioCaptureService.EXTRA_DATA, data)
            putExtra(AudioCaptureService.EXTRA_IP, ip)
            putExtra(AudioCaptureService.EXTRA_PORT, port)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        isStreaming = true
        streamingStartTime = System.currentTimeMillis()
        timerHandler.post(timerRunnable)
        updateUI()
    }

    private fun stopStreaming() {
        val intent = Intent(this, AudioCaptureService::class.java).apply {
            action = AudioCaptureService.ACTION_STOP
        }
        startService(intent)
        handleServiceStopped()
    }

    private fun handleServiceStopped() {
        if (savedVolume != -1) {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, savedVolume, 0)
            savedVolume = -1
        }
        
        isStreaming = false
        timerHandler.removeCallbacks(timerRunnable)
        updateUI()
    }

    private fun updateUI() {
        if (isStreaming) {
            // USB UI - streaming state
            usbStartBtn.text = getString(R.string.stop_stream)
            usbStartBtn.background = ContextCompat.getDrawable(this, R.drawable.button_stop)
            usbStartBtn.setTextColor(ContextCompat.getColor(this, R.color.error))
            usbPortInput.isEnabled = false
            usbMuteCheckbox.isEnabled = false
            usbStatusText.text = getString(R.string.status_streaming)
            usbStatusText.setTextColor(ContextCompat.getColor(this, R.color.primary))
            usbStreamingTimer.visibility = View.VISIBLE
            
            // WiFi UI - streaming state
            wifiStartBtn.text = getString(R.string.stop_stream)
            wifiStartBtn.background = ContextCompat.getDrawable(this, R.drawable.button_stop)
            wifiStartBtn.setTextColor(ContextCompat.getColor(this, R.color.error))
            wifiIpInput.isEnabled = false
            wifiPortInput.isEnabled = false
            wifiMuteCheckbox.isEnabled = false
            wifiStatusText.text = getString(R.string.status_streaming)
            wifiStatusText.setTextColor(ContextCompat.getColor(this, R.color.primary))
            wifiStreamingTimer.visibility = View.VISIBLE
            
            // Disable tab switching while streaming
            tabUsb.isEnabled = false
            tabWifi.isEnabled = false
            tabBluetooth.isEnabled = false
            tabUsb.alpha = 0.5f
            tabWifi.alpha = 0.5f
            tabBluetooth.alpha = 0.5f
        } else {
            // USB UI - idle state
            usbStartBtn.text = getString(R.string.start_stream)
            usbStartBtn.background = ContextCompat.getDrawable(this, R.drawable.button_primary)
            usbStartBtn.setTextColor(ContextCompat.getColor(this, R.color.black))
            usbPortInput.isEnabled = true
            usbMuteCheckbox.isEnabled = true
            usbStatusText.text = getString(R.string.status_default)
            usbStatusText.setTextColor(ContextCompat.getColor(this, R.color.hint_color))
            usbStreamingTimer.visibility = View.GONE
            
            // WiFi UI - idle state
            wifiStartBtn.text = getString(R.string.start_stream)
            wifiStartBtn.background = ContextCompat.getDrawable(this, R.drawable.button_primary)
            wifiStartBtn.setTextColor(ContextCompat.getColor(this, R.color.black))
            wifiIpInput.isEnabled = true
            wifiPortInput.isEnabled = true
            wifiMuteCheckbox.isEnabled = true
            wifiStatusText.text = getString(R.string.status_default)
            wifiStatusText.setTextColor(ContextCompat.getColor(this, R.color.hint_color))
            wifiStreamingTimer.visibility = View.GONE
            
            // Enable tab switching
            tabUsb.isEnabled = true
            tabWifi.isEnabled = true
            tabBluetooth.isEnabled = true
            tabUsb.alpha = 1f
            tabWifi.alpha = 1f
            tabBluetooth.alpha = 1f
        }
    }
}
