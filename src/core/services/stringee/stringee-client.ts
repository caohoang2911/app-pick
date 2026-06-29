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
import { displayIncomingCall, reportCallEnded } from './callkeep';

let client: StringeeClient | null = null;
let currentUserId: string | null = null;
let isConnecting = false;

export const getStringeeClient = (): StringeeClient | null => client;

/** Khởi tạo client + gắn listener (idempotent). */
function ensureClient(): StringeeClient {
  if (client) return client;

  const stringeeClient = new StringeeClient();
  const listener = new StringeeClientListener();

  listener.onConnect = (_c, userId) => {
    console.log('[Stringee] onConnect', userId);
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
    console.log(
      '[Stringee] onIncomingCall2 from=',
      call.from,
      'alias=',
      call.fromAlias,
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
    const uuid = await call.generateUUID();
    registerCall(uuid, call);

    const info = {
      callUuid: uuid,
      callId: call.callId,
      fromNumber: call.from,
      fromAlias: call.fromAlias,
    };
    setIncomingCall(info);
    displayIncomingCall(info);
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
 */
export const registerStringeePush = async (
  deviceToken: string,
  isVoip: boolean,
): Promise<void> => {
  if (!client || !deviceToken) return;
  try {
    await client.registerPush(deviceToken, Env.IS_PRODUCTION, isVoip);
  } catch (e) {
    console.warn('[Stringee] registerPush failed', e);
  }
};

export const unregisterStringeePush = async (
  deviceToken: string,
): Promise<void> => {
  if (!client || !deviceToken) return;
  try {
    await client.unregisterPush(deviceToken);
  } catch (e) {
    console.warn('[Stringee] unregisterPush failed', e);
  }
};
