import {
  AppState,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNCallKeep, { CONSTANTS as CK_CONSTANTS } from 'react-native-callkeep';

import { getCallState, resetCall, setCallAnswered } from '@/core/store/call';
import type { IncomingCallInfo } from '@/types/call';

import { getCallByUuid, removeCall } from './call-registry';

let _isSetup = false;
let _listenersAdded = false;
// Đã nhắc user bật "tài khoản gọi" chưa (tránh mở màn cài đặt lặp lại).
let _promptedEnable = false;
// Trạng thái phone account lần check gần nhất — để biết user vừa bật trong
// Settings (false→true) và cần force `RNCallKeep.setup` lại như cold start.
let _lastKnownPhoneAccountEnabled: boolean | null = null;
// UUID của cuộc gọi mà user đã bấm "Nhận" trên màn hình gốc TRƯỚC khi cuộc gọi
// qua socket kịp được đăng ký (xảy ra khi app bị kill rồi mở lại để answer).
let _pendingAnswerUuid: string | null = null;
// UUID user đã bấm "Từ chối" trên màn gọi gốc khi call qua socket CHƯA kịp đăng
// ký (app bị kill): không có StringeeCall2 để reject → xếp hàng, reject ngay khi
// call về (`consumePendingReject`) thì caller mới nhận được tín hiệu.
let _pendingRejectUuid: string | null = null;
// UUID đã nhận event 'answerCall' từ native — để `answerFromApp` biết đường
// answer qua native có phản hồi không (fallback khi thiếu connection native).
let _answerHandledUuid: string | null = null;
// UUID đang answer DỞ (đã gửi lệnh answer, chờ Stringee phản hồi ~1-2s): chặn
// answer trùng (fallback 700ms vs event native về muộn), đồng thời cho
// `onHandleOnAnotherDevice` biết sự kiện 'answered' là của CHÍNH máy này.
let _answeringUuid: string | null = null;

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

/**
 * Android: kéo app lên foreground khi có cuộc gọi lúc app ở nền/bị kill — để
 * IncomingCallScreen/OngoingCallScreen trong app hiện lên, đồng thời gỡ chặn mic
 * (Android 11+ cấp SILENCE cho app nền đang thu âm → caller không nghe thấy gì).
 * Android 10+ có thể CHẶN start-activity-từ-nền (khi đó chỉ còn heads-up của hệ
 * thống — gọi hàm này vô hại); được phép khi máy cấp quyền "Hiển thị trên ứng
 * dụng khác" hoặc khi user vừa tương tác với notification cuộc gọi.
 * iOS: no-op — CallKit toàn màn hình là UX chuẩn, không tự kéo app được.
 */
export const backToForegroundIfNeeded = (): void => {
  if (Platform.OS !== 'android') return;
  if (AppState.currentState === 'active') return;
  try {
    RNCallKeep.backToForeground();
  } catch (e) {
    console.warn('[CallKeep] backToForeground failed', e);
  }
};

/** User bấm "Nhận" trên màn hình gọi gốc (kể cả khi đang khoá máy / app bị kill). */
const onAnswerCall = async ({ callUUID }: { callUUID: string }) => {
  const call = getCallByUuid(callUUID);
  _answerHandledUuid = callUUID;
  if (getCallState().status === 'answered') return; // tránh answer 2 lần
  if (_answeringUuid === callUUID) return; // đang answer dở → bỏ lệnh trùng
  if (!call) {
    // Đánh thức từ background/kill: cuộc gọi qua socket chưa kịp đăng ký. Xếp
    // hàng để `consumePendingAnswer` answer ngay khi `handleIncomingCall` xong.
    // ⚠️ Nếu socket KHÔNG BAO GIỜ giao cuộc gọi này (không connect được /
    // connect user khác) thì answer kẹt ở đây vĩnh viễn: UI hiện đàm thoại
    // (setCurrentCallActive) nhưng caller vẫn đổ chuông.
    console.warn(
      '[CallKeep] answerCall: CHƯA có StringeeCall2 cho uuid=',
      callUUID,
      '→ xếp hàng pendingAnswer, chờ call về qua socket',
    );
    _pendingAnswerUuid = callUUID;
    RNCallKeep.setCurrentCallActive(callUUID);
    backToForegroundIfNeeded();
    return;
  }
  _answeringUuid = callUUID;
  try {
    // Mic phải được cấp TRƯỚC khi answer, không thì bên kia nhận track câm.
    await ensureMicPermission();
    // Android: báo telecom ACTIVE ngay tại thời điểm bấm — để connection nằm
    // RINGING suốt vòng answer() (~1-2s) thì một số máy (LG…) coi là bất nhất
    // và tự disconnect → handler onEndCall hangup Stringee → caller thấy Ended.
    if (Platform.OS === 'android') RNCallKeep.setCurrentCallActive(callUUID);
    await call.answer();
    setCallAnswered();
    if (Platform.OS === 'ios') RNCallKeep.setCurrentCallActive(callUUID);
    backToForegroundIfNeeded();
  } catch (e) {
    console.warn('[CallKeep] answerCall failed', e);
  } finally {
    _answeringUuid = null;
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
  // iOS killed: VoIP push launch app → AppDelegate report CallKit → user có thể
  // bấm Nhận/Từ chối TRƯỚC khi JS kịp gắn listener. RNCallKeep buffer các sự
  // kiện đó và phát lại 1 lần qua 'didLoadWithEvents' — phải bơm lại vào đúng
  // handler, không thì answer/reject từ killed bị nuốt.
  RNCallKeep.addEventListener('didLoadWithEvents', (events: any) => {
    for (const e of events || []) {
      if (e?.name === 'RNCallKeepPerformAnswerCallAction') {
        void onAnswerCall(e.data);
      } else if (e?.name === 'RNCallKeepPerformEndCallAction') {
        void onEndCall(e.data);
      }
    }
  });
}

// ─── API công khai ────────────────────────────────────────────────────────────

/** Khởi tạo CallKeep + đăng ký listener (idempotent). Gọi 1 lần sau khi đăng nhập. */
export const setupCallKeep = async (opts?: {
  force?: boolean;
}): Promise<void> => {
  if (_isSetup && !opts?.force) return;
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
  if (Platform.OS !== 'android') return;
  try {
    const enabled = await RNCallKeep.checkPhoneAccountEnabled();
    console.log('[CallKeep] phoneAccountEnabled =', enabled);
    _lastKnownPhoneAccountEnabled = enabled;
    if (enabled) {
      RNCallKeep.setAvailable(true);
      return;
    }
    if (_promptedEnable) return;
    _promptedEnable = true;
    console.warn(
      '[CallKeep] Tài khoản gọi CHƯA bật → popup nền/kill sẽ KHÔNG hiện + answer rơi vào fallback (dễ mất tiếng). Mở màn cài đặt cho user bật.',
    );
    NativeModules.RNCallKeep?.openPhoneAccounts?.();
  } catch (e) {
    console.warn('[CallKeep] ensurePhoneAccountEnabled failed', e);
  }
};

/**
 * Gọi khi app quay lại foreground (sau Settings / cấp quyền).
 * User vừa bật tài khoản gọi (false→true): `reloadAsync` như mở lại app —
 * force setup trong cùng session thường KHÔNG đủ trên nhiều máy Android.
 */
export const refreshCallKeepOnForeground = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    const enabled = await RNCallKeep.checkPhoneAccountEnabled();
    const wasEnabled = _lastKnownPhoneAccountEnabled;
    _lastKnownPhoneAccountEnabled = enabled;
    console.log(
      '[CallKeep] refresh on foreground, phoneAccountEnabled =',
      enabled,
      'was=',
      wasEnabled,
    );
    if (!enabled) return;

    // Chỉ khi trước đó đã biết là TẮT rồi giờ BẬT (sau màn Settings).
    // wasEnabled === null (lần đầu) mà đã bật sẵn → không reload (tránh loop login).
    if (wasEnabled === false) {
      console.log(
        '[CallKeep] phone account vừa bật → reloadAsync (như tắt/mở app)',
      );
      const { reloadAppSafely } = require('@/core/utils/reload-app-safely');
      await reloadAppSafely('phone-account-enabled');
      return;
    }

    RNCallKeep.setAvailable(true);
  } catch (e) {
    console.warn('[CallKeep] refreshCallKeepOnForeground failed', e);
  }
};

/**
 * Android: đảm bảo quyền MICRO trước khi đàm thoại. Manifest có RECORD_AUDIO
 * nhưng runtime chưa chắc được cấp (app chỉ hay xin camera cho phần scan) —
 * thiếu quyền thì WebRTC vẫn kết nối nhưng gửi track CÂM: máy bên kia
 * "không nhận được âm thanh bên app". iOS: hệ thống tự hỏi khi lần đầu dùng mic.
 */
export const ensureMicPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (granted) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Quyền micro',
        message: 'App Pick cần micro để đàm thoại với tổng đài',
        buttonPositive: 'Đồng ý',
        buttonNegative: 'Huỷ',
      },
    );
    console.log('[CallKeep] mic permission:', result);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.warn('[CallKeep] mic permission failed', e);
    return false;
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
  if (_pendingRejectUuid === callUuid) _pendingRejectUuid = null;
  removeCall(callUuid);
};

/**
 * Kết thúc cuộc gọi (reject nếu đang đổ chuông, hangup nếu đang nói).
 * Dùng chung cho cả sự kiện native `endCall` lẫn nút bấm trong app.
 */
export const endCall = async (callUuid: string): Promise<void> => {
  const call = getCallByUuid(callUuid);
  const status = getCallState().status;
  if (!call) {
    // App bị kill: call qua socket chưa đăng ký → chưa có gì để reject với
    // Stringee. Xếp hàng — khi call về, `handleIncomingCall` reject giùm để
    // caller nhận tín hiệu (không thì đầu kia đổ chuông tới timeout).
    _pendingRejectUuid = callUuid;
  }
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
  console.log('[CallKeep] consumePendingAnswer: answer cuộc gọi', callUuid);
  _pendingAnswerUuid = null;
  if (getCallState().status === 'answered') return;
  if (_answeringUuid === callUuid) return; // đang answer dở ở đường khác
  const call = getCallByUuid(callUuid);
  if (!call) return;
  _answeringUuid = callUuid;
  try {
    await ensureMicPermission();
    // Cùng lý do onAnswerCall: Android set ACTIVE trước vòng answer() để telecom
    // không tự disconnect connection đang RINGING.
    if (Platform.OS === 'android') RNCallKeep.setCurrentCallActive(callUuid);
    await call.answer();
    setCallAnswered();
    if (Platform.OS === 'ios') RNCallKeep.setCurrentCallActive(callUuid);
  } catch (e) {
    console.warn('[CallKeep] consumePendingAnswer failed', e);
  } finally {
    _answeringUuid = null;
  }
};

/**
 * Áp dụng reject đã xếp hàng (user Từ chối khi app còn bị kill) — gọi từ
 * `handleIncomingCall` NGAY SAU `registerCall`, TRƯỚC khi set state/hiện UI.
 * @returns true nếu cuộc gọi đã bị reject (bỏ qua mọi xử lý hiển thị sau đó).
 */
export const consumePendingReject = async (
  callUuid: string,
): Promise<boolean> => {
  if (_pendingRejectUuid !== callUuid) return false;
  _pendingRejectUuid = null;
  const call = getCallByUuid(callUuid);
  try {
    await call?.reject();
  } catch (e) {
    console.warn('[CallKeep] consumePendingReject failed', e);
  }
  try {
    RNCallKeep.endCall(callUuid);
  } catch {
    // bỏ qua
  }
  removeCall(callUuid);
  resetCall();
  return true;
};

/** Có đang answer dở `callUuid` không — sự kiện 'answered' lúc đó là của CHÍNH máy này. */
export const isAnsweringCall = (callUuid: string): boolean =>
  _answeringUuid === callUuid;

/**
 * Dọn state CallKeep khi ĐĂNG XUẤT: pending answer/reject + uuid đang xử lý
 * đều thuộc phiên user cũ — để sót sang phiên user mới thì answer/reject bị
 * route lạc. Đồng thời hạ mọi màn gọi gốc còn treo (cuộc gọi của account cũ
 * không còn ai xử lý được nữa).
 */
export const resetCallKeepState = (): void => {
  _pendingAnswerUuid = null;
  _pendingRejectUuid = null;
  _answerHandledUuid = null;
  _answeringUuid = null;
  _promptedEnable = false;
  _lastKnownPhoneAccountEnabled = null;
  try {
    RNCallKeep.endAllCalls();
  } catch {
    // bỏ qua
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
  // Xin mic NGAY khi còn foreground + trước khi WebRTC khởi động.
  await ensureMicPermission();
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
