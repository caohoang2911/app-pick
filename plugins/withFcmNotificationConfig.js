/* eslint-disable */
// Config plugin FCM — survive `expo prebuild --clean`:
//  1) meta-data `default_notification_sound = ding`
//  2) CustomFirebaseMessagingService.kt + đăng ký Manifest
//     (skip tray cho push cuộc gọi Stringee — tránh "You have a new notification")
//
// LƯU Ý:
//  - `default_notification_channel_id` KHÔNG đặt ở đây vì expo-notifications tự
//    quản. Channel id qua `firebase.json`
//    (`react-native.messaging_android_notification_channel_id`).
//  - File ding.mp3 do expo-notifications `sounds` bundle vào res/raw (app.json).
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-fcm-notification-config', version: '1.1.0' };

const META_NAME = 'com.google.firebase.messaging.default_notification_sound';
const META_VALUE = 'ding';
const SERVICE_CLASS = '.CustomFirebaseMessagingService';

function buildKotlinSource(packageName) {
  return `package ${packageName}

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
import org.json.JSONObject

class CustomFirebaseMessagingService : FirebaseMessagingService() {
    private val TAG = "FCMService"
    private val CHANNEL_ID = "default_channel_id"
    private val CHANNEL_NAME = "Default Channel"

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: \${remoteMessage.from}")

        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: \$data")
        }

        // Push cuộc gọi Stringee → CallKeep (JS background handler) lo màn gọi.
        // Không hiện tray "You have a new notification".
        if (isStringeeCallPush(data)) {
            Log.d(TAG, "Stringee call push → skip system tray notification")
            return
        }

        if (remoteMessage.notification == null && data.isNotEmpty()) {
            sendNotification(
                data["title"] ?: "Thông báo mới",
                data["body"] ?: data["message"] ?: "",
                data,
            )
            return
        }

        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Message Notification Body: \${notification.body}")
            sendNotification(
                notification.title ?: "Thông báo mới",
                notification.body ?: "",
                data,
            )
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: \$token")
    }

    /** Khớp JS \`isStringeeCallPush\` trong register-background-call-handler.ts. */
    private fun isStringeeCallPush(data: Map<String, String>): Boolean {
        if (data.isEmpty()) return false
        if (data["type"] == "CALL_EVENT") return true
        if (data.containsKey("stringeePushNotification")) return true

        val inner = data["data"]
        if (!inner.isNullOrBlank()) {
            try {
                val json = JSONObject(inner)
                if (json.has("callId") || json.has("callStatus")) return true
                val status = json.optString("callStatus", "")
                if (status == "started" || status == "ringing") return true
            } catch (_: Exception) {
            }
        }

        if (data.containsKey("callId") || data.containsKey("callStatus")) return true
        return false
    }

    private fun sendNotification(
        title: String,
        messageBody: String,
        data: Map<String, String>,
    ) {
        val launchIntent =
            packageManager.getLaunchIntentForPackage(packageName)
                ?: Intent(this, MainActivity::class.java)

        launchIntent.apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            data.forEach { (key, value) -> putExtra(key, value) }
        }

        val pendingIntent =
            PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

        val soundUri = Uri.parse("android.resource://\${packageName}/raw/ding")

        val notificationBuilder =
            NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)

        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            var channel = notificationManager.getNotificationChannel(CHANNEL_ID)
            if (channel == null) {
                channel =
                    NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH,
                    ).apply {
                        description = "Default notification channel"
                        enableVibration(true)
                        enableLights(true)
                        val audioAttributes =
                            AudioAttributes.Builder()
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                                .build()
                        setSound(soundUri, audioAttributes)
                    }
                notificationManager.createNotificationChannel(channel)
            }
        }

        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
`;
}

function ensureSoundMeta(application) {
  application['meta-data'] = application['meta-data'] || [];
  const metaList = application['meta-data'];
  let item = metaList.find((m) => m.$ && m.$['android:name'] === META_NAME);
  if (!item) {
    item = { $: {} };
    metaList.push(item);
  }
  item.$['android:name'] = META_NAME;
  item.$['android:value'] = META_VALUE;
}

function ensureMessagingService(application) {
  application.service = application.service || [];
  const exists = application.service.some(
    (s) => s.$?.['android:name'] === SERVICE_CLASS,
  );
  if (exists) return;

  application.service.push({
    $: {
      'android:name': SERVICE_CLASS,
      'android:exported': 'false',
    },
    'intent-filter': [
      {
        action: [
          { $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } },
        ],
      },
    ],
  });
}

function withFcmManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;
    ensureSoundMeta(application);
    ensureMessagingService(application);
    return cfg;
  });
}

function withFcmMessagingServiceKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const packageName =
        cfg.android?.package ||
        AndroidConfig.Package.getPackage(cfg) ||
        'com.caohoang2911.AppPick';
      const packagePath = packageName.replace(/\./g, '/');
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java',
        packagePath,
      );
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(
        path.join(destDir, 'CustomFirebaseMessagingService.kt'),
        buildKotlinSource(packageName),
        'utf8',
      );
      return cfg;
    },
  ]);
}

const withFcmNotificationConfig = (config) => {
  config = withFcmManifest(config);
  config = withFcmMessagingServiceKotlin(config);
  return config;
};

module.exports = createRunOncePlugin(
  withFcmNotificationConfig,
  pkg.name,
  pkg.version,
);
