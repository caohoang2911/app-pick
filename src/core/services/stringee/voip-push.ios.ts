import VoipPushNotification from 'react-native-voip-push-notification';

import { registerStringeePush } from './stringee-client';

let _listenersAdded = false;
let _voipToken: string | null = null;

/**
 * Mỗi lần mở app / đăng nhập: đăng ký lại VoIP token với Stringee.
 * (Không unregister trước — token chưa có trên server sẽ báo
 * "Device token does not exist" vô ích và dễ lệch registration.)
 */
async function reregisterVoipPush(token: string): Promise<void> {
  await registerStringeePush(token, true, true);
}

/** Thông tin rút gọn từ payload VoIP push của Stringee. */
type VoipCallPayload = {
  callId?: string;
  callStatus?: string;
  toNumber?: string;
};

/**
 * Bóc payload VoIP push (dictionaryPayload) — cấu trúc lồng `data.map.data.map`
 * giống native AppDelegate parse (withStringeeVoip.js), fallback dần về phẳng.
 */
function parseVoipPayload(raw: unknown): VoipCallPayload {
  const r = raw as Record<string, any> | null | undefined;
  let d: Record<string, any> | undefined = r?.data?.map?.data?.map;
  if (!d || typeof d !== 'object') d = r?.data;
  if (!d || typeof d !== 'object') d = r ?? {};
  const to = d?.to;
  const toNumber =
    (typeof to === 'object' ? (to?.map?.number ?? to?.number) : to) ??
    undefined;
  return {
    callId: d?.callId != null ? String(d.callId) : undefined,
    callStatus: typeof d?.callStatus === 'string' ? d.callStatus : undefined,
    toNumber: toNumber != null ? String(toNumber) : undefined,
  };
}

/**
 * VoIP push tới nhưng KHÔNG được phép đổ chuông tiếp thì hạ ngay:
 * - Push cho user KHÁC user đang đăng nhập ("registration ma" còn sót trên
 *   server Stringee sau khi đổi tài khoản trên cùng máy — unregister lúc logout
 *   thất bại/offline) hoặc đã logout. Native vẫn PHẢI report CallKit (luật
 *   iOS 13, không đọc được MMKV để tự guard) → JS hạ chuông ngay khi nhận
 *   payload. Không hạ thì cuộc gọi này không có StringeeCall2 nào trên socket
 *   (đang connect user mới) → nhận/từ chối đều rơi vào pending vĩnh viễn:
 *   chuông treo tới timeout, caller không nhận được tín hiệu gì.
 * - Push trạng thái `ended`/`agentEnded` (caller huỷ khi máy còn đổ chuông):
 *   iOS không có đường FCM background như Android nên phải hạ ở đây.
 */
function dismissGhostOrEndedCall(raw: unknown): void {
  try {
    const payload = parseVoipPayload(raw);
    // Lazy require như register-background-call-handler — tránh vòng import.
    const { getUserInfo } = require('@/core/store/auth/utils');
    const { getStringeeUserId } = require('@/core/utils/stringee-user');
    const currentUserId = getStringeeUserId(getUserInfo() ?? undefined);
    const isGhost =
      !currentUserId ||
      (payload.toNumber != null && payload.toNumber !== currentUserId);
    const isEnd =
      payload.callStatus === 'ended' || payload.callStatus === 'agentEnded';
    if (!isGhost && !isEnd) return;

    const { getCallState, resetCall } = require('@/core/store/call');
    // Đang đàm thoại thật thì không đụng — kết thúc cuộc gọi đã nghe do đường
    // socket (onChangeSignalingState) lo.
    if (getCallState().status === 'answered') return;

    console.log(
      '[StringeeVoIP] hạ chuông từ VoIP push — isGhost=',
      isGhost,
      'callStatus=',
      payload.callStatus,
      'to=',
      payload.toNumber,
      'currentUserId=',
      currentUserId,
    );
    const RNCallKeep = require('react-native-callkeep').default;
    RNCallKeep.endAllCalls();
    resetCall();
  } catch (e) {
    console.warn('[StringeeVoIP] xử lý payload VoIP push lỗi', e);
  }
}

/**
 * Cấu hình PushKit (iOS): lấy VoIP token và đăng ký với Stringee để nhận
 * cuộc gọi khi app ở background/bị kill. Việc report cuộc gọi tới CallKit
 * khi nhận VoIP push được làm ở native (AppDelegate, qua config plugin).
 *
 * Gọi lại MỖI LẦN mở app / đăng nhập để đăng ký lại VoIP token với Stringee
 * (logout đã xoá `_lastPushReg`). Guard chỉ áp cho việc gắn listener.
 */
export const configureVoipPush = (): void => {
  if (!_listenersAdded) {
    _listenersAdded = true;

    VoipPushNotification.addEventListener('register', (token) => {
      _voipToken = token;
      // isVoip = true; isProduction = true vì cả 2 EAS profile đều
      // `ios.distribution: store` ⇒ entitlement aps-environment = production.
      // (Đừng dùng Env.IS_PRODUCTION — đó là môi trường API, không phải APNs.)
      void reregisterVoipPush(token);
    });

    VoipPushNotification.addEventListener('notification', (notification) => {
      const uuid = (notification as { uuid?: string })?.uuid;
      if (uuid) {
        try {
          VoipPushNotification.onVoipNotificationCompleted(uuid);
        } catch {
          // bỏ qua
        }
      }
      dismissGhostOrEndedCall(notification);
    });
  }

  // Token PushKit không đổi theo user → dùng luôn cache để đăng ký cho user
  // vừa đăng nhập, khỏi chờ native re-emit.
  if (_voipToken) {
    void reregisterVoipPush(_voipToken);
  }
  // Vẫn yêu cầu native emit lại 'register' (idempotent) — phòng token xoay vòng
  // hoặc lần đầu chưa có cache.
  VoipPushNotification.registerVoipToken();
};

export const getVoipToken = (): string | null => _voipToken;
