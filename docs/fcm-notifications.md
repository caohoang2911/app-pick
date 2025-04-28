# FCM Notifications Guide

This guide explains how to send Firebase Cloud Messaging (FCM) notifications with custom sounds to the app, ensuring they work properly in all app states (foreground, background, and quit).

## FCM Notification Payload Format

### For Android

For Android notifications with custom sounds, use the following format:

```json
{
  "to": "<FCM_TOKEN>",
  "notification": {
    "title": "New Order",
    "body": "You have a new order to process",
    "sound": "ding"
  },
  "data": {
    "orderCode": "ORD12345",
    "targetScr": "ORDER-PICK",
    "click_action": "FLUTTER_NOTIFICATION_CLICK",
    "sound": "ding"
  },
  "android": {
    "notification": {
      "sound": "ding",
      "channel_id": "default_channel_id",
      "priority": "high"
    }
  }
}
```

### For iOS

For iOS notifications with custom sounds, use the following format:

```json
{
  "to": "<FCM_TOKEN>",
  "notification": {
    "title": "New Order",
    "body": "You have a new order to process",
    "sound": "ding.mp3"
  },
  "data": {
    "orderCode": "ORD12345",
    "targetScr": "ORDER-PICK"
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "ding.mp3",
        "badge": 1,
        "content-available": 1
      }
    }
  }
}
```

### For Both Platforms

To send notifications to both platforms at once:

```json
{
  "to": "<FCM_TOKEN>",
  "notification": {
    "title": "New Order",
    "body": "You have a new order to process"
  },
  "data": {
    "orderCode": "ORD12345",
    "targetScr": "ORDER-PICK"
  },
  "android": {
    "notification": {
      "sound": "ding",
      "channel_id": "default_channel_id",
      "priority": "high"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "ding.mp3",
        "badge": 1,
        "content-available": 1
      }
    }
  }
}
```

## Important Notes

1. **Android Sound Files**: 
   - The custom sound file must be located in `android/app/src/main/res/raw/ding.mp3`
   - In the payload, you should reference it without the file extension: `"sound": "ding"`

2. **iOS Sound Files**:
   - The custom sound file must be added to the Xcode project bundle
   - In the payload, include the file extension: `"sound": "ding.mp3"`

3. **Channel ID**:
   - For Android 8.0 (Oreo) and above, we use a notification channel named `default_channel_id`
   - This must match the channel ID created in the app code and in the notification payload

4. **Data Payload**:
   - For navigating to the correct screen, include `orderCode` and `targetScr` in the data payload
   - `targetScr` should be one of: `"ORDER-PICK"` or `"ORDER-INVOICE"`

5. **When App is Quit**:
   - For notifications to play sound when the app is completely closed, the server payload must include the sound configuration as shown above
   - Android requires the channel_id and sound name to match what's configured in the app
   - iOS requires the sound file name in the aps payload

## Testing FCM Notifications

You can test FCM notifications using the Firebase Console or by using the FCM HTTP v1 API with cURL:

```bash
curl --location 'https://fcm.googleapis.com/fcm/send' \
--header 'Authorization: key=YOUR_SERVER_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "to": "FCM_TOKEN",
  "notification": {
    "title": "Test Notification",
    "body": "This is a test notification with custom sound"
  },
  "data": {
    "orderCode": "TEST123",
    "targetScr": "ORDER-PICK"
  },
  "android": {
    "notification": {
      "sound": "ding",
      "channel_id": "default_channel_id",
      "priority": "high"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "ding.mp3",
        "badge": 1,
        "content-available": 1
      }
    }
  }
}'
``` 