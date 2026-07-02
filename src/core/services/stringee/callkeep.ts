import { NativeModules, Platform } from 'react-native';
import RNCallKeep, { CONSTANTS as CK_CONSTANTS } from 'react-native-callkeep';

import { getCallState, resetCall, setCallAnswered } from '@/core/store/call';
import type { IncomingCallInfo } from '@/types/call';

import { getCallByUuid, removeCall } from './call-registry';

let _isSetup = false;
let _listenersAdded = false;
// Đã nhắc user bật "tài khoản gọi" chưa (tránh mở màn cài đặt lặp lại).
let _promptedEnable = false;
// UUID của cuộc gọi mà user đã bấm "Nhận" trên màn hình gốc TRƯỚC khi cuộc gọi
// qua socket kịp được đăng ký (xảy ra khi app bị kill rồi mở lại để answer).
let _pendingAnswerUuid: string | null = null;
// UUID đã nhận event 'answerCall' từ native — để `answerFromApp` biết đường
// answer qua native có phản hồi không (fallback khi thiếu connection native).
let _answerHandledUuid: string | null = null;

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
  _answerHandledUuid = callUUID;
  if (getCallState().status === 'answered') return; // tránh answer 2 lần
  const call = getCallByUuid(callUUID);
  if (!call) {
    // Đánh thức từ background/kill: cuộc gọi qua socket chưa kịp đăng ký. Xếp
    // hàng để `consumePendingAnswer` answer ngay khi `handleIncomingCall` xong.
    _pendingAnswerUuid = callUUID;
    RNCallKeep.setCurrentCallActive(callUUID);
    return;
  }
  try {
    await call.answer();
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

/**
 * Android (managed ConnectionService, selfManaged=false): tài khoản gọi phải
 * được user BẬT trong Cài đặt → Tài khoản gọi thì `displayIncomingCall` mới
 * dựng được màn gọi khi app ở background/kill. `RNCallKeep.setup()` chỉ ĐĂNG KÝ
 * account chứ KHÔNG tự bật (managed mode không thể bật bằng code). Nếu chưa bật,
 * `RNCallKeepModule.displayIncomingCall` bị bỏ qua IM LẶNG (guard hasPhoneAccount).
 *
 * Hàm này kiểm tra, nếu chưa bật thì mở thẳng màn cài đặt cho user bật (chỉ 1 lần
 * mỗi phiên). PHẢI gọi ở foreground (sau đăng nhập) — KHÔNG gọi trong headless
 * task vì không mở được UI cài đặt từ đó.
 */
export const ensurePhoneAccountEnabled = async (): Promise<void> => {
  if (Platform.OS !== 'android' || _promptedEnable) return;
  try {
    const enabled = await RNCallKeep.checkPhoneAccountEnabled();
    console.log('[CallKeep] phoneAccountEnabled =', enabled);
    if (!enabled) {
      _promptedEnable = true;
      console.warn(
        '[CallKeep] Tài khoản gọi CHƯA bật → cuộc gọi nền/kill sẽ KHÔNG hiện. Mở màn "Tài khoản gọi" để user bật.',
      );
      // `openPhoneAccounts` = màn "Calling accounts" (danh sách account để bật/tắt).
      // Không public trên RNCallKeep JS nên gọi qua native module.
      NativeModules.RNCallKeep?.openPhoneAccounts?.();
    }
  } catch (e) {
    console.warn('[CallKeep] ensurePhoneAccountEnabled failed', e);
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
  if (_pendingAnswerUuid === callUuid) _pendingAnswerUuid = null;
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
  if (_pendingAnswerUuid === callUuid) _pendingAnswerUuid = null;
  removeCall(callUuid);
  resetCall();
};

/** Có answer đang chờ cho `callUuid` không (đã bấm Nhận trước khi call đăng ký). */
export const hasPendingAnswer = (callUuid: string): boolean =>
  _pendingAnswerUuid === callUuid;

/**
 * Áp dụng answer đã xếp hàng từ background/kill — gọi từ `handleIncomingCall`
 * NGAY SAU khi `registerCall`, lúc này `getCallByUuid(uuid)` đã có call thật.
 */
export const consumePendingAnswer = async (callUuid: string): Promise<void> => {
  if (_pendingAnswerUuid !== callUuid) return;
  _pendingAnswerUuid = null;
  if (getCallState().status === 'answered') return;
  const call = getCallByUuid(callUuid);
  try {
    await call?.answer();
    setCallAnswered();
    RNCallKeep.setCurrentCallActive(callUuid);
  } catch (e) {
    console.warn('[CallKeep] consumePendingAnswer failed', e);
  }
};

/**
 * Nhận cuộc gọi từ nút bấm trong app (foreground). KHÔNG answer thẳng Stringee:
 * phải đi qua native (iOS CXAnswerCallAction / Android Connection.onAnswer) —
 * đúng đường như bấm Nhận trên popup gọi gốc — để (1) popup gốc ngừng đổ chuông,
 * (2) hệ thống chuyển audio sang chế độ đàm thoại (Android `setAudioModeIsVoip`,
 * iOS activate audio session qua CallKit); thiếu bước này thì Stringee answer
 * xong vẫn KHÔNG có tiếng. Native sau đó bắn event 'answerCall' →
 * `onAnswerCall` answer Stringee + set state như bình thường.
 */
export const answerFromApp = async (callUuid: string): Promise<void> => {
  if (getCallState().status === 'answered') return;
  try {
    RNCallKeep.answerIncomingCall(callUuid);
  } catch (e) {
    console.warn('[CallKeep] answerIncomingCall failed', e);
  }
  // Fallback: không có connection native (vd. Android chưa bật "tài khoản gọi"
  // nên popup chưa từng hiện) → native nuốt lệnh IM LẶNG, event 'answerCall'
  // không bao giờ về → answer trực tiếp qua chính handler đó.
  setTimeout(() => {
    if (_answerHandledUuid === callUuid) return; // native đã phản hồi
    if (getCallState().status !== 'incoming') return; // đã nhận/đã kết thúc
    console.warn('[CallKeep] native answer không phản hồi → answer trực tiếp');
    void onAnswerCall({ callUUID: callUuid });
  }, 700);
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
