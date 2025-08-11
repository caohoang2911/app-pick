package com.caohoang2911.AppPick

import android.app.Service
import android.content.Intent
import android.media.AudioManager
import android.media.AudioAttributes
import android.os.IBinder
import android.util.Log

class AudioService : Service() {
    
    private lateinit var audioManager: AudioManager
    
    override fun onCreate() {
        super.onCreate()
        audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        configureAudioSession()
    }
    
    private fun configureAudioSession() {
        try {
            // Set audio mode for notification sounds
            audioManager.mode = AudioManager.MODE_NORMAL
            
            // Configure audio attributes for notification sounds
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            
            // Set audio attributes for notification channel
            audioManager.setAudioAttributes(audioAttributes)
            
            Log.d("AudioService", "Audio session configured successfully")
            
        } catch (e: Exception) {
            Log.e("AudioService", "Error configuring audio session: ${e.message}")
            e.printStackTrace()
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Keep service running to maintain audio session
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d("AudioService", "Audio service destroyed")
    }
} 