import { Platform } from 'react-native';
import RNCallKeep, { CONSTANTS as CK_CONSTANTS } from 'react-native-callkeep';

import { getCallState, resetCall, setCallAnswered } from '@/core/store/call';
import type { IncomingCallInfo } from '@/types/call';

import { getCallByUuid, removeCall } from './call-registry';

let _isSetup = false;
let _listenersAdded = false;

const SETUP_OPTIONS = {
  ios: {
    appName: 'App Pick',
    supportsVideo: false,
    maximumCallGroups: '1',
    maximumCallsPerCallGroup: '1',
  },
  android: {
    alertTitle: 'Cấp quyền cuộc gọi',
    alertDescription: 'App Pick cần quyền để hiển thị cuộc gọi đến từ tổng đài',
    cancelButton: 'Huỷ',
    okButton: 'Đồng ý',
    additionalPermissions: [] as string[],
    selfManaged: false,
    foregroundService: {
      channelId: 'com.caohoang2911.apppick.call',
      channelName: 'Cuộc gọi đến',
      notificationTitle: 'App Pick đang nhận cuộc gọi',
    },
  },
};

// ─── Sự kiện từ native (CallKit / ConnectionService) ─────────────────────────

/** User bấm "Nhận" trên màn hình gọi gốc (kể cả khi đang khoá máy / app bị kill). */
const onAnswerCall = async ({ callUUID }: { callUUID: string }) => {
  if (getCallState().status === 'answered') return; // tránh answer 2 lần
  const call = getCallByUuid(callUUID);
  try {
    await call?.answer();
    setCallAnswered();
    RNCallKeep.setCurrentCallActive(callUUID);
  } catch (e) {
    console.warn('[CallKeep] answerCall failed', e);
  }
};

/** User bấm "Từ chối"/"Kết thúc" trên màn hình gọi gốc. */
const onEndCall = async ({ callUUID }: { callUUID: string }) => {
  await endCall(callUUID);
};

/** User bật/tắt mic trên màn hình gọi gốc (iOS). */
const onSetMuted = async ({
  callUUID,
  muted,
}: {
  callUUID: string;
  muted: boolean;
}) => {
  const call = getCallByUuid(callUUID);
  try {
    await call?.mute(muted);
    getCallState().setMuted(muted);
  } catch (e) {
    console.warn('[CallKeep] setMuted failed', e);
  }
};

const onAudioSessionActivated = () => {
  // iOS: CallKit đã kích hoạt audio session — Stringee tự quản lý media stream.
};

function registerListeners() {
  if (_listenersAdded) return;
  _listenersAdded = true;
  RNCallKeep.addEventListener('answerCall', onAnswerCall);
  RNCallKeep.addEventListener('endCall', onEndCall);
  RNCallKeep.addEventListener('didPerformSetMutedCallAction', onSetMuted);
  RNCallKeep.addEventListener(
    'didActivateAudioSession',
    onAudioSessionActivated,
  );
}

// ─── API công khai ────────────────────────────────────────────────────────────

/** Khởi tạo CallKeep + đăng ký listener (idempotent). Gọi 1 lần sau khi đăng nhập. */
export const setupCallKeep = async (): Promise<void> => {
  if (_isSetup) return;
  try {
    await RNCallKeep.setup(SETUP_OPTIONS);
    if (Platform.OS === 'android') {
      RNCallKeep.setAvailable(true);
    }
    registerListeners();
    _isSetup = true;
  } catch (e) {
    console.warn('[CallKeep] setup failed', e);
  }
};

/** Hiển thị màn hình cuộc gọi đến gốc (CallKit/ConnectionService). */
export const displayIncomingCall = (info: IncomingCallInfo): void => {
  try {
    RNCallKeep.displayIncomingCall(
      info.callUuid,
      info.fromNumber || 'unknown',
      info.fromAlias || info.fromNumber || 'Tổng đài',
      'generic',
      false,
    );
  } catch (e) {
    console.warn('[CallKeep] displayIncomingCall failed', e);
  }
};

/** Cuộc gọi kết thúc từ phía Stringee (đầu kia cúp máy) → đóng UI gốc. */
export const reportCallEnded = (callUuid: string): void => {
  try {
    RNCallKeep.reportEndCallWithUUID(
      callUuid,
      CK_CONSTANTS.END_CALL_REASONS.REMOTE_ENDED,
    );
  } catch (e) {
    try {
      RNCallKeep.endCall(callUuid);
    } catch {
      // bỏ qua
    }
  }
  removeCall(callUuid);
};

/**
 * Kết thúc cuộc gọi (reject nếu đang đổ chuông, hangup nếu đang nói).
 * Dùng chung cho cả sự kiện native `endCall` lẫn nút bấm trong app.
 */
export const endCall = async (callUuid: string): Promise<void> => {
  const call = getCallByUuid(callUuid);
  const status = getCallState().status;
  try {
    if (status === 'incoming') {
      await call?.reject();
    } else {
      await call?.hangup();
    }
  } catch (e) {
    console.warn('[CallKeep] endCall failed', e);
  }
  try {
    RNCallKeep.endCall(callUuid);
  } catch {
    // bỏ qua
  }
  removeCall(callUuid);
  resetCall();
};

/** Nhận cuộc gọi từ nút bấm trong app (foreground). */
export const answerFromApp = async (callUuid: string): Promise<void> => {
  if (getCallState().status === 'answered') return;
  const call = getCallByUuid(callUuid);
  try {
    await call?.answer();
    setCallAnswered();
    RNCallKeep.setCurrentCallActive(callUuid);
  } catch (e) {
    console.warn('[CallKeep] answerFromApp failed', e);
  }
};

/** Bật/tắt mic từ nút bấm trong app. */
export const toggleMuteFromApp = async (
  callUuid: string,
  muted: boolean,
): Promise<void> => {
  const call = getCallByUuid(callUuid);
  try {
    await call?.mute(muted);
    getCallState().setMuted(muted);
    if (Platform.OS === 'ios') RNCallKeep.setMutedCall(callUuid, muted);
  } catch (e) {
    console.warn('[CallKeep] toggleMute failed', e);
  }
};

/** Bật/tắt loa ngoài từ nút bấm trong app. */
export const toggleSpeakerFromApp = async (
  callUuid: string,
  on: boolean,
): Promise<void> => {
  const call = getCallByUuid(callUuid);
  try {
    await call?.setSpeakerphoneOn(on);
    getCallState().setSpeaker(on);
    if (Platform.OS === 'android') {
      RNCallKeep.toggleAudioRouteSpeaker(callUuid, on);
    }
  } catch (e) {
    console.warn('[CallKeep] toggleSpeaker failed', e);
  }
};
