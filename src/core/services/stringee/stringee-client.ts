import { AppState, Platform } from 'react-native';
import {
  SignalingState,
  StringeeCall2Listener,
  StringeeClient,
  StringeeClientListener,
} from 'stringee-react-native-v2';
import type { StringeeCall2 } from 'stringee-react-native-v2';

import { Env } from '~/env';

import { genStringeeToken } from '@/api/stringee/gen-stringee-token';
import {
  getCallState,
  resetCall,
  setCallAnswered,
  setCallEnded,
  setIncomingCall,
} from '@/core/store/call';

import { getUuidByCall, registerCall } from './call-registry';
import {
  backToForegroundIfNeeded,
  consumePendingAnswer,
  consumePendingReject,
  displayIncomingCall,
  hasPendingAnswer,
  isAnsweringCall,
  reportCallEnded,
} from './callkeep';

/**
 * Package name (Android) / bundle id (iOS) của app, cả dev lẫn prod — PHẢI khớp
 * `app.config.ts`. Dùng cho `registerPushAndDeleteOthers`: đăng ký token máy này
 * đồng thời XOÁ token các máy khác cùng account có package nằm trong danh sách,
 * để một account đăng nhập trên nhiều thiết bị thì chỉ 1 máy đổ chuông.
 */
const APP_PACKAGE_NAMES = [
  'com.caohoang2911.AppPick',
  'com.caohoang2911.AppPickDev',
  'com.caohoang2911.seedcom-app-pick',
  'com.caohoang2911.seedcom-app-pick-dev',
];

let client: StringeeClient | null = null;
let currentUserId: string | null = null;
let isConnecting = false;
// Lưu lần đăng ký push gần nhất để đăng ký lại sau khi `onConnect` (token có thể
// được lấy trước khi connect xong — nhất là iOS với event VoIP `register`).
let _lastPushReg: {
  deviceToken: string;
  isProduction: boolean;
  isVoip: boolean;
} | null = null;

export const getStringeeClient = (): StringeeClient | null => client;

/** Khởi tạo client + gắn listener (idempotent). */
function ensureClient(): StringeeClient {
  if (client) return client;

  const stringeeClient = new StringeeClient();
  const listener = new StringeeClientListener();

  listener.onConnect = (_c, _userId) => {
    // Đăng ký lại push sau khi đã connect để không mất lần đăng ký chạy trước đó.
    if (_lastPushReg && client) {
      client
        .registerPushAndDeleteOthers(
          _lastPushReg.deviceToken,
          _lastPushReg.isProduction,
          _lastPushReg.isVoip,
          APP_PACKAGE_NAMES,
        )
        .catch((e) => console.warn('[Stringee] re-registerPush failed', e));
    }
  };
  listener.onDisConnect = () => {};
  listener.onFailWithError = (_c, code, message) => {
    console.warn('[Stringee] onFailWithError', code, message);
  };
  // Token hết hạn → lấy token mới rồi kết nối lại.
  listener.onRequestAccessToken = async () => {
    if (!currentUserId || !client) return;
    try {
      const token = await genStringeeToken(currentUserId);
      client.connect(token);
    } catch (e) {
      console.warn('[Stringee] refresh token failed', e);
    }
  };
  listener.onIncomingCall2 = (_c, call) => {
    // Event cuộc gọi qua SOCKET (foreground, hoặc sau khi app thức dậy + connect lại).
    void handleIncomingCall(call);
  };
  // Call v1 (không phải Call2): tổng đài/CS có thể makeCall thay vì makeCall2.
  // Trước đây chỉ lắng nghe onIncomingCall2 → cuộc gọi v1 bị nuốt im lặng.
  listener.onIncomingCall = (_c, call) => {
    void handleIncomingCall(call);
  };

  stringeeClient.setListener(listener);
  client = stringeeClient;
  return stringeeClient;
}

/** Gắn listener cho 1 cuộc gọi đến để theo dõi trạng thái signaling/media. */
function bindCallListener(call: StringeeCall2): void {
  const callListener = new StringeeCall2Listener();

  callListener.onChangeSignalingState = (c, state) => {
    if (state === SignalingState.answered) {
      setCallAnswered();
    } else if (
      state === SignalingState.busy ||
      state === SignalingState.ended
    ) {
      // Đầu kia kết thúc → đóng UI gốc + reset state.
      setCallEnded();
      const uuid = getUuidByCall(c);
      if (uuid) reportCallEnded(uuid);
      setTimeout(() => resetCall(), 500);
    }
  };

  callListener.onChangeMediaState = () => {};

  callListener.onAudioDeviceChange = () => {};

  // Cuộc gọi đã được THIẾT BỊ KHÁC (cùng account) xử lý. Push chỉ đổ về 1 máy
  // (registerPushAndDeleteOthers) nhưng khi nhiều máy cùng mở app thì socket
  // vẫn đổ chuông tất cả — máy khác nhận/từ chối thì đóng màn gọi ở máy này.
  callListener.onHandleOnAnotherDevice = (c, state) => {
    if (getCallState().status === 'answered') return; // máy này đang đàm thoại
    const uuid = getUuidByCall(c);
    // Đang answer DỞ trên chính máy này (answer() chưa phản hồi nên status chưa
    // kịp 'answered') → sự kiện 'answered' là CỦA MÌNH, không phải máy khác.
    if (uuid && isAnsweringCall(uuid) && state === SignalingState.answered) {
      return;
    }
    if (
      state === SignalingState.answered ||
      state === SignalingState.busy ||
      state === SignalingState.ended
    ) {
      if (uuid) reportCallEnded(uuid);
      resetCall();
    }
  };

  call.setListener(callListener);
}

/** Xử lý cuộc gọi đến: hiển thị UI TRƯỚC, rồi mới chuẩn bị answer. */
async function handleIncomingCall(call: StringeeCall2): Promise<void> {
  try {
    bindCallListener(call);

    // iOS: generateUUID() trả về đúng UUID mà CallKit/PushKit đã report (cùng
    // singleton cache theo callId-serial). Android: generateUUID() reject (chỉ
    // iOS) — dùng callId ổn định, cũng là UUID mà handler FCM nền đã dùng.
    // iOS mà generateUUID lỗi thì fallback callId — answer qua CallKit có thể
    // lệch UUID nhưng UI trong app vẫn phải hiện.
    let uuid: string;
    if (Platform.OS === 'ios') {
      try {
        uuid = await call.generateUUID();
      } catch (e) {
        console.warn('[Stringee] generateUUID lỗi → fallback callId', e);
        uuid = String(call.callId);
      }
    } else {
      uuid = String(call.callId);
    }
    registerCall(uuid, call);

    // User đã bấm "Từ chối" trên màn gọi gốc khi app còn bị kill (trước khi call
    // qua socket kịp về) → reject ngay cho caller nhận tín hiệu, bỏ qua hiển thị.
    if (await consumePendingReject(uuid)) return;

    const info = {
      callUuid: uuid,
      callId: call.callId,
      fromNumber: call.from,
      fromAlias: call.fromAlias,
    };
    // Set store TRƯỚC mọi await dễ lỗi (initAnswer) — store là thứ quyết định
    // IncomingCallScreen/OngoingCallScreen trong app có hiện hay không.
    setIncomingCall(info);

    // Tránh hiển thị trùng: nếu cuộc gọi tới khi app ở nền/bị kill thì màn hình
    // gọi gốc đã do native (iOS PushKit) / headless (Android FCM) dựng sẵn, và
    // user có thể đã bấm Nhận (pending answer). Chỉ tự hiển thị khi đang foreground.
    if (AppState.currentState === 'active' && !hasPendingAnswer(uuid)) {
      displayIncomingCall(info);
    } else {
      // App ở nền: store vừa set 'incoming' → kéo app lên (nếu OS cho phép) để
      // IncomingCallScreen trong app hiện thay vì chỉ heads-up nhỏ của hệ thống.
      backToForegroundIfNeeded();
    }

    // Chuẩn bị media cho answer — SAU khi UI đã lên; lỗi thì answer sẽ báo riêng.
    try {
      await call.initAnswer();
    } catch (e) {
      console.warn('[Stringee] initAnswer failed', e);
    }

    // Áp answer đã xếp hàng (khi user Nhận lúc app còn bị kill).
    await consumePendingAnswer(uuid);
  } catch (e) {
    console.warn('[Stringee] handleIncomingCall failed', e);
  }
}

// ─── API công khai ────────────────────────────────────────────────────────────

/**
 * Lấy token cho `userId`, retry vài lần trước khi bỏ cuộc. Login là thời điểm
 * dễ tổn thương nhất: fetch token fail 1 phát là user mất socket CẢ PHIÊN
 * (push vẫn đổ chuông nhưng không có StringeeCall2 để nhận/từ chối — chuông
 * treo, caller không nhận tín hiệu) vì không có gì trigger connect lại.
 */
async function genTokenWithRetry(
  userId: string,
  attempts: number,
): Promise<string> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await genStringeeToken(userId);
    } catch (e) {
      lastErr = e;
      console.warn(`[Stringee] genToken lần ${i}/${attempts} lỗi`, e);
      if (i < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * i));
      }
    }
  }
  throw lastErr;
}

/** Chờ native báo đã connect (hoặc timeout). `connect()` của SDK không await handshake. */
function waitUntilConnected(timeoutMs: number): Promise<boolean> {
  if (client?.isConnected) return Promise.resolve(true);
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (client?.isConnected) {
        clearInterval(timer);
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

/** Lấy token cho `userId` rồi kết nối tới Stringee. */
export const connectStringee = async (userId: string): Promise<void> => {
  if (isConnecting) {
    // Đang connect dở — chờ xong thay vì return sớm (tránh race login nhanh).
    await waitUntilConnected(15000);
    return;
  }
  // Đã kết nối đúng user này rồi — vd. handler FCM headless connect lúc app bị
  // kill, sau đó user mở app → useStringeeCall gọi lại. connect() lần nữa sẽ
  // re-handshake làm rơi cuộc gọi đang đổ chuông → giữ nguyên session cũ.
  if (client?.isConnected && currentUserId === userId) {
    return;
  }
  isConnecting = true;
  try {
    // Đổi tài khoản trên cùng client (logout B → login C mà disconnect của
    // luồng logout chưa/không chạy): ngắt session cũ TRƯỚC khi connect user
    // mới — connect đè khi native còn giữ session user khác làm event cuộc
    // gọi thất lạc khó đoán.
    if (client && currentUserId && currentUserId !== userId) {
      try {
        client.disconnect();
      } catch (e) {
        console.warn('[Stringee] disconnect (đổi user) failed', e);
      }
    }
    currentUserId = userId;
    const c = ensureClient();
    const token = await genTokenWithRetry(userId, 3);
    c.connect(token);
    const ok = await waitUntilConnected(15000);
    if (!ok) {
      console.warn(
        '[Stringee] connect timeout — chưa nhận onConnect trong 15s',
      );
    }
  } catch (e) {
    console.warn('[Stringee] connect failed', e);
  } finally {
    isConnecting = false;
  }
};

export const disconnectStringee = (): void => {
  try {
    client?.disconnect();
  } catch (e) {
    console.warn('[Stringee] disconnect failed', e);
  }
  currentUserId = null;
};

/**
 * Đăng ký device token để Stringee đẩy push đánh thức máy khi có cuộc gọi.
 * Dùng `registerPushAndDeleteOthers` thay vì `registerPush` để xoá luôn token
 * của các thiết bị khác đang đăng nhập cùng account → chỉ máy này đổ chuông.
 * @param isVoip iOS: true = VoIP push (PushKit); Android: false.
 * @param isProduction iOS: PHẢI khớp môi trường APNs của bản build (App Store
 *   / store distribution ⇒ production). Mặc định `Env.IS_PRODUCTION` (môi trường
 *   API) — KHÔNG nhất thiết bằng môi trường APNs, nên iOS cần truyền tường minh.
 */
export const registerStringeePush = async (
  deviceToken: string,
  isVoip: boolean,
  isProduction: boolean = Env.IS_PRODUCTION,
): Promise<void> => {
  if (!deviceToken) return;
  _lastPushReg = { deviceToken, isProduction, isVoip };
  if (!client) return;
  try {
    await client.registerPushAndDeleteOthers(
      deviceToken,
      isProduction,
      isVoip,
      APP_PACKAGE_NAMES,
    );
  } catch (e) {
    console.warn('[Stringee] registerPushAndDeleteOthers failed', e);
  }
};

/**
 * Huỷ đăng ký push của user hiện tại lúc đăng xuất. Thất bại là để lại
 * "registration ma" trên server: máy này vẫn nhận push cuộc gọi của account CŨ
 * sau khi đăng nhập account khác → retry 1 lần + log rõ kết quả. Nếu vẫn fail
 * thì lớp guard theo `to` trong payload (bg handler Android / listener VoIP
 * iOS) sẽ chặn hiển thị các push ma đó.
 */
export const unregisterStringeePush = async (
  deviceToken: string,
): Promise<boolean> => {
  _lastPushReg = null;
  if (!client || !deviceToken) return false;
  for (let i = 1; i <= 2; i++) {
    try {
      await client.unregisterPush(deviceToken);
      return true;
    } catch (e) {
      const msg = String(e);
      // Token chưa từng đăng ký / đã xoá trên server → coi như đã sạch (idempotent).
      if (/does not exist/i.test(msg)) {
        return true;
      }
      console.warn(`[Stringee] unregisterPush lần ${i}/2 lỗi`, e);
      if (i < 2) await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return false;
};
