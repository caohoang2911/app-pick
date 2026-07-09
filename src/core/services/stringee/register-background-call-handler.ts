import messaging from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

type DataPayload = Record<string, unknown>;

/** Thông tin cuộc gọi Stringee sau khi bóc tách khỏi payload FCM. */
type StringeeCallData = {
  callId?: string | number;
  serial?: string | number;
  callStatus?: string;
  from?: { number?: string; alias?: string } | string;
  fromNumber?: string;
  fromAlias?: string;
};

/**
 * Bóc tách payload cuộc gọi Stringee từ message FCM.
 *
 * ⚠️ Android FCM: MỌI field trong `data` là string, nên Stringee nhét toàn bộ
 * thông tin cuộc gọi dưới dạng CHUỖI JSON ở `data.data` (xem doc RN push của
 * Stringee), KHÔNG phải key phẳng `data.callId`. Handler cũ đọc phẳng nên
 * `isStringeeCallPush` luôn trả false ⇒ cuộc gọi bị đẩy nhầm sang thông báo
 * thường, không bao giờ hiện màn gọi. Hàm này parse `data.data` rồi fallback:
 *  - `data.data` là object (một số transport) → dùng luôn
 *  - payload phẳng (nếu backend đổi) → dùng chính `data`
 */
function parseStringeePayload(raw: DataPayload): StringeeCallData {
  const inner = raw?.data;
  if (typeof inner === 'string') {
    try {
      return JSON.parse(inner) as StringeeCallData;
    } catch {
      // không phải JSON hợp lệ → rơi xuống fallback bên dưới
    }
  }
  if (inner && typeof inner === 'object') {
    return inner as StringeeCallData;
  }
  return raw as StringeeCallData;
}

/** Nhận diện push cuộc gọi Stringee (đọc từ payload đã bóc tách). */
export function isStringeeCallPush(raw: DataPayload): boolean {
  // marker top-level Stringee hay set → nhận diện nhanh, khỏi parse.
  if (raw?.type === 'CALL_EVENT' || raw?.stringeePushNotification != null) {
    return true;
  }
  const c = parseStringeePayload(raw);
  return !!c.callId || c.callStatus === 'started' || c.callStatus === 'ringing';
}

/** Hiển thị màn hình cuộc gọi đến (Android, khi app ở background/bị kill). */
async function showIncomingCallFromPush(raw: DataPayload): Promise<void> {
  // Lazy require để không nạp module native ở các push không phải cuộc gọi.
  const { setupCallKeep } = require('./callkeep');
  const RNCallKeep = require('react-native-callkeep').default;
  // Killed state: cây React chưa mount nên CallKeep chưa được setup ở context
  // chính → phải setup ngay trong headless task này thì mới dựng được màn gọi.
  await setupCallKeep();

  const c = parseStringeePayload(raw);
  // `from` có thể là object {number, alias} (payload Stringee) hoặc string.
  const from = c.from;
  const number =
    (typeof from === 'object' ? from?.number : from) ?? c.fromNumber;
  const alias =
    (typeof from === 'object' ? from?.alias : undefined) ??
    c.fromAlias ??
    number;

  // UUID phải KHỚP `String(call.callId)` mà foreground dùng (xem stringee-client)
  // để khi app thức dậy, registry tra cứu đúng call lúc answer. Dùng callId,
  // KHÔNG dùng serial.
  const uuid = String(c.callId ?? c.serial);
  RNCallKeep.displayIncomingCall(
    uuid,
    String(number ?? 'unknown'),
    String(alias ?? 'Tổng đài'),
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
    const isCall = isStringeeCallPush(data);
    console.log(
      '[StringeeBg] FCM background/killed nhận được — isCall=',
      isCall,
    );
    try {
      if (Platform.OS === 'android' && isCall) {
        // Đã đăng xuất nhưng token Stringee còn sót trên server (vd. logout lúc
        // offline nên unregisterPush không tới nơi) → bỏ qua, không dựng màn gọi.
        // Lazy require để push không phải cuộc gọi khỏi nạp MMKV.
        const { getToken, getUserInfo } = require('@/core/store/auth/utils');
        if (!getToken()) {
          console.log('[StringeeBg] đã đăng xuất → bỏ qua cuộc gọi');
          return;
        }
        const payload = parseStringeePayload(data);
        const status = payload.callStatus;
        console.log('[StringeeBg] cuộc gọi Stringee, callStatus=', status);
        // Chỉ dựng màn gọi khi bắt đầu đổ chuông. Với answered thì thôi — nhưng
        // vẫn `return` để KHÔNG rơi xuống thông báo có tiếng.
        if (
          status === undefined ||
          status === 'started' ||
          status === 'ringing'
        ) {
          await showIncomingCallFromPush(data);
          // Kéo app lên foreground ngay khi đổ chuông để IncomingCallScreen
          // trong app hiện (thay vì chỉ heads-up nhỏ của hệ thống). Android 10+
          // có thể chặn (khi đó còn nguyên popup hệ thống) — gọi vẫn vô hại.
          const { backToForegroundIfNeeded } = require('./callkeep');
          backToForegroundIfNeeded();
          // App bị KILL: màn gọi gốc hiện được nhưng chưa có StringeeCall2 nào
          // để Nhận/Từ chối → connect Stringee ngay trong headless context này
          // (cùng JS runtime). Call sẽ về qua socket → handleIncomingCall đăng
          // ký call (setIncomingCall → IncomingCallScreen hiện khi app đã mở)
          // + tiêu thụ pending answer/reject user đã bấm. Khi user mở app sau
          // đó, connectStringee có guard isConnected + cùng userId nên KHÔNG
          // reconnect làm rơi cuộc gọi.
          const { connectStringee } = require('./stringee-client');
          const { getStringeeUserId } = require('@/core/utils/stringee-user');
          const userId = getStringeeUserId(getUserInfo() ?? undefined);
          if (userId) {
            await connectStringee(userId);
          } else {
            console.warn('[StringeeBg] thiếu userId → không connect được');
          }
        } else if (status === 'ended' || status === 'agentEnded') {
          // Caller huỷ khi máy này còn đang đổ chuông → hạ màn gọi gốc, không
          // để chuông treo tới timeout. Không đụng tới cuộc gọi ĐÃ nghe (đường
          // socket onChangeSignalingState lo việc kết thúc đàm thoại).
          const { getCallState, resetCall } = require('@/core/store/call');
          if (getCallState().status !== 'answered') {
            const { reportCallEnded } = require('./callkeep');
            reportCallEnded(String(payload.callId ?? payload.serial));
            resetCall();
          }
        }
        return;
      }
      await showNotificationWithSound(remoteMessage);
    } catch (e) {
      console.log('[StringeeBg] handler error', e);
    }
  });
}
