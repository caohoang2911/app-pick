package com.caohoang2911.AppPick

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri

import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CustomFirebaseMessagingService : FirebaseMessagingService() {
    private val TAG = "FCMService"
    private val CHANNEL_ID = "default_channel_id"
    private val CHANNEL_NAME = "Default Channel"

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            
            // If the notification doesn't have a notification payload but has data,
            // we'll create our own notification from data
            if (remoteMessage.notification == null) {
                val data = remoteMessage.data
                sendNotification(
                    data["title"] ?: "New Message",
                    data["body"] ?: "You have a new notification",
                    data
                )
            }
        }

        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            sendNotification(
                it.title ?: "New Message",
                it.body ?: "",
                remoteMessage.data
            )
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        // If you want to send messages to this application instance or
        // manage this apps subscriptions on the server side, send the
        // FCM registration token to your app server.
    }

    private fun sendNotification(title: String, messageBody: String, data: Map<String, String>) {
        // Create a pending intent for the activity - using the package's main activity
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this, applicationContext.javaClass)
        
        launchIntent.apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            
            // Add all data to the intent
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Get the custom sound URI
        val soundUri = Uri.parse("android.resource://${packageName}/raw/ding")

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Using a system icon instead of R.mipmap
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Since Android Oreo, notification channels are required
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Check if channel exists first to avoid recreating existing channel
            var channel = notificationManager.getNotificationChannel(CHANNEL_ID)
            
            if (channel == null) {
                channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Default notification channel"
                    enableVibration(true)
                    enableLights(true)
                    
                    // Set the sound for this channel
                    val audioAttributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                    setSound(soundUri, audioAttributes)
                }
                
                notificationManager.createNotificationChannel(channel)
            }
        }

        // Generate a unique notification ID, or use a fixed one
        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}