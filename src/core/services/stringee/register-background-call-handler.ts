import messaging from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type DataPayload = Record<string, unknown>;

/** Nhận diện push cuộc gọi Stringee qua data payload. */
function isStringeeCallPush(data: DataPayload): boolean {
  return (
    !!data?.callId ||
    data?.callStatus === 'started' ||
    data?.callStatus === 'ringing'
  );
}

/** Hiển thị màn hình cuộc gọi đến (Android, khi app ở background/bị kill). */
async function showIncomingCallFromPush(data: DataPayload): Promise<void> {
  // Lazy require để không nạp module native ở các push không phải cuộc gọi.
  const { setupCallKeep } = require('./callkeep');
  const RNCallKeep = require('react-native-callkeep').default;
  // Killed state: cây React chưa mount nên CallKeep chưa được setup ở context
  // chính → phải setup ngay trong headless task này thì mới dựng được màn gọi.
  await setupCallKeep();
  // UUID phải KHỚP `String(call.callId)` mà foreground dùng (xem stringee-client)
  // để khi app thức dậy, registry tra cứu đúng call lúc answer.
  const uuid = String(data.callId ?? data.serial);
  RNCallKeep.displayIncomingCall(
    uuid,
    String(data.fromNumber ?? data.from ?? 'unknown'),
    String(data.fromAlias ?? data.from ?? 'Tổng đài'),
    'generic',
    false,
  );
  console.log('[StringeeBg] displayIncomingCall xong, uuid=', uuid);
}

/** Giữ nguyên hành vi cũ: phát thông báo có âm thanh khi nhận push ở background. */
async function showNotificationWithSound(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title || 'Thông báo mới',
        body: remoteMessage.notification?.body || '',
        data: {
          ...remoteMessage.data,
          aps: { sound: 'ding.mp3', badge: 1, 'content-available': 1 },
        },
        sound: 'ding.mp3',
      },
      trigger: null,
    });
  } else {
    // channelId được truyền qua biến để tránh excess-property-check của TS.
    const content: any = {
      title: remoteMessage.notification?.title || '',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data || {},
      sound: 'ding.mp3',
      channelId: 'default_channel_id',
    };
    await Notifications.scheduleNotificationAsync({ content, trigger: null });
  }
}

/**
 * Đăng ký 1 handler DUY NHẤT cho FCM background/quit message.
 *
 * Phải gọi ở entry point (top-level, xem `index.js`) để chạy được cả khi app
 * bị kill (headless JS task). FirebaseMessaging chỉ cho phép 1 background
 * handler — handler này thay thế cho cái cũ trong `usePushNotifications`:
 *  - Cuộc gọi Stringee (Android) → hiển thị CallKeep.
 *  - Còn lại → thông báo có âm thanh như trước.
 */
export function registerBackgroundCallHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const data = (remoteMessage?.data || {}) as DataPayload;
    console.log(
      '[StringeeBg] FCM background/killed message NHẬN ĐƯỢC — isCall=',
      isStringeeCallPush(data),
      'data=',
      data,
    );
    try {
      if (Platform.OS === 'android' && isStringeeCallPush(data)) {
        console.log('[StringeeBg] → cuộc gọi Stringee, callId=', data.callId);
        await showIncomingCallFromPush(data);
        return;
      }
      await showNotificationWithSound(remoteMessage);
    } catch (e) {
      console.log('[StringeeBg] handler error', e);
    }
  });
}
