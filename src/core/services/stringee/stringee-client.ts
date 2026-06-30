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
  resetCall,
  setCallAnswered,
  setCallEnded,
  setIncomingCall,
} from '@/core/store/call';

import { getUuidByCall, registerCall } from './call-registry';
import {
  consumePendingAnswer,
  displayIncomingCall,
  hasPendingAnswer,
  reportCallEnded,
} from './callkeep';

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

  listener.onConnect = (_c, userId) => {
    console.log('[Stringee] onConnect', userId);
    // Đăng ký lại push sau khi đã connect để không mất lần đăng ký chạy trước đó.
    if (_lastPushReg && client) {
      client
        .registerPush(
          _lastPushReg.deviceToken,
          _lastPushReg.isProduction,
          _lastPushReg.isVoip,
        )
        .catch((e) => console.warn('[Stringee] re-registerPush failed', e));
    }
  };
  listener.onDisConnect = () => {
    console.log('[Stringee] onDisConnect');
  };
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
    console.log(
      '[Stringee] onIncomingCall2 (socket) from=',
      call.from,
      'alias=',
      call.fromAlias,
      'callId=',
      call.callId,
    );
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
    console.log('[Stringee] signaling state:', state);
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

  callListener.onChangeMediaState = (_c, mediaState) => {
    console.log('[Stringee] media state:', mediaState);
  };

  callListener.onAudioDeviceChange = () => {};

  call.setListener(callListener);
}

/** Xử lý cuộc gọi đến: chuẩn bị answer, sinh UUID, hiển thị CallKeep. */
async function handleIncomingCall(call: StringeeCall2): Promise<void> {
  try {
    bindCallListener(call);
    await call.initAnswer();

    // iOS: generateUUID() trả về đúng UUID mà CallKit/PushKit đã report (cùng
    // singleton cache theo callId-serial). Android: generateUUID() reject (chỉ
    // iOS) — dùng callId ổn định, cũng là UUID mà handler FCM nền đã dùng.
    const uuid =
      Platform.OS === 'ios' ? await call.generateUUID() : String(call.callId);
    registerCall(uuid, call);

    const info = {
      callUuid: uuid,
      callId: call.callId,
      fromNumber: call.from,
      fromAlias: call.fromAlias,
    };
    setIncomingCall(info);

    // Tránh hiển thị trùng: nếu cuộc gọi tới khi app ở nền/bị kill thì màn hình
    // gọi gốc đã do native (iOS PushKit) / headless (Android FCM) dựng sẵn, và
    // user có thể đã bấm Nhận (pending answer). Chỉ tự hiển thị khi đang foreground.
    if (AppState.currentState === 'active' && !hasPendingAnswer(uuid)) {
      displayIncomingCall(info);
    }

    // Áp answer đã xếp hàng (khi user Nhận lúc app còn bị kill).
    await consumePendingAnswer(uuid);
  } catch (e) {
    console.warn('[Stringee] handleIncomingCall failed', e);
  }
}

// ─── API công khai ────────────────────────────────────────────────────────────

/** Lấy token cho `userId` rồi kết nối tới Stringee. */
export const connectStringee = async (userId: string): Promise<void> => {
  if (isConnecting) return;
  isConnecting = true;
  try {
    currentUserId = userId;
    const c = ensureClient();
    console.log('[Stringee] connecting as userId =', userId);
    const token = await genStringeeToken(userId);
    console.log('[Stringee] got token, length =', token?.length);
    c.connect(token);
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
    await client.registerPush(deviceToken, isProduction, isVoip);
  } catch (e) {
    console.warn('[Stringee] registerPush failed', e);
  }
};

export const unregisterStringeePush = async (
  deviceToken: string,
): Promise<void> => {
  _lastPushReg = null;
  if (!client || !deviceToken) return;
  try {
    await client.unregisterPush(deviceToken);
  } catch (e) {
    console.warn('[Stringee] unregisterPush failed', e);
  }
};
