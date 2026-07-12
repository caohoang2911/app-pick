import messaging from '@react-native-firebase/messaging';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { useAuth } from '@/core';
import {
  clearCalls,
  configureVoipPush,
  connectStringee,
  disconnectStringee,
  ensureMicPermission,
  ensurePhoneAccountEnabled,
  getVoipToken,
  refreshCallKeepOnForeground,
  registerStringeePush,
  resetCallKeepState,
  setupCallKeep,
  unregisterStringeePush,
} from '@/core/services/stringee';
import { resetCall } from '@/core/store/call';
import { getStringeeUserId } from '@/core/utils/stringee-user';

/**
 * Quản lý vòng đời kết nối Stringee theo trạng thái đăng nhập:
 * - `signIn` → setup CallKeep, connect Stringee, đăng ký push (VoIP iOS / FCM Android).
 * - `signOut` → huỷ đăng ký push + ngắt kết nối + reset state cuộc gọi.
 *
 * Gọi 1 lần ở composition root (sau khi đã qua cổng auth).
 */
export const useStringeeCall = (): void => {
  const status = useAuth.use.status();
  const userInfo = useAuth.use.userInfo();
  const androidTokenRef = useRef<string | null>(null);
  const prevStatusRef = useRef(status);
  // Promise dọn dẹp của lần đăng xuất gần nhất — đăng nhập user mới PHẢI đợi
  // nó xong: cleanup chạy async (unregister push đua timeout rồi mới
  // disconnect), login nhanh mà connect trước thì disconnect trễ của user cũ
  // sẽ giết luôn kết nối vừa mở của user mới.
  const signOutCleanupRef = useRef<Promise<void>>(Promise.resolve());

  // Kết nối khi đăng nhập.
  useEffect(() => {
    if (status !== 'signIn') return;
    const userId = getStringeeUserId(userInfo);
    if (!userId) {
      console.warn(
        '[Stringee] userId rỗng (userInfo.username) — KHÔNG kết nối được. userInfo =',
        userInfo,
      );
      return;
    }

    let cancelled = false;
    let unsubscribeTokenRefresh: (() => void) | undefined;
    (async () => {
      await signOutCleanupRef.current;
      if (cancelled) return;
      await setupCallKeep();
      if (cancelled) return;

      // Android: đăng ký FCM push SỚM (song song connect) — trước đây bị chặn sau
      // ensurePhoneAccountEnabled (mở Settings) + xin mic nên phải login một lúc
      // mới nhận cuộc gọi nền/kill.
      if (Platform.OS === 'android') {
        const [, fcmToken] = await Promise.all([
          connectStringee(userId),
          messaging()
            .getToken()
            .catch((e) => {
              console.warn('[Stringee] get FCM token failed', e);
              return null as string | null;
            }),
        ]);
        if (cancelled) return;

        if (fcmToken) {
          androidTokenRef.current = fcmToken;
          await registerStringeePush(fcmToken, false);
        }
        if (cancelled) return;

        unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
          console.log('[Stringee] FCM token refreshed → re-registerPush');
          androidTokenRef.current = newToken;
          void registerStringeePush(newToken, false);
        });
        if (cancelled) {
          unsubscribeTokenRefresh();
          return;
        }

        // Quyền UI sau push — không chặn nhận cuộc gọi.
        await ensurePhoneAccountEnabled();
        if (cancelled) return;
        await ensureMicPermission();
        return;
      }

      // iOS
      await connectStringee(userId);
      if (cancelled) return;
      configureVoipPush();
    })();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
    };
  }, [status, userInfo?.username]);

  // Android: user bật "Tài khoản gọi" trong Settings rồi quay lại app — phải
  // force setup CallKeep lại (như tắt/mở app). Chỉ setAvailable thường không đủ.
  useEffect(() => {
    if (Platform.OS !== 'android' || status !== 'signIn') return;

    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') return;
      // Delay ngắn: OS cập nhật trạng thái phone account sau khi rời Settings.
      setTimeout(() => {
        void refreshCallKeepOnForeground();
      }, 400);
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [status]);

  // Ngắt kết nối khi đăng xuất (logout chủ động hoặc bị đá văng vì hết phiên —
  // mọi đường đều đi qua `signOut()` của auth store nên gom xử lý ở đây).
  useEffect(() => {
    if (prevStatusRef.current === 'signIn' && status === 'signOut') {
      signOutCleanupRef.current = (async () => {
        // unregisterPush để máy này KHÔNG còn nhận push cuộc gọi của account cũ.
        // iOS dùng VoIP token (PushKit), Android dùng FCM token.
        const token =
          Platform.OS === 'ios' ? getVoipToken() : androidTokenRef.current;
        if (token) {
          // PHẢI đợi unregister xong mới disconnect (lệnh đi qua kết nối đang
          // sống). Race timeout phòng socket đã chết → callback không bao giờ
          // về (5s đủ cho retry bên trong unregisterStringeePush).
          await Promise.race([
            unregisterStringeePush(token),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
        }
        androidTokenRef.current = null;
        disconnectStringee();
        // Dọn state cuộc gọi của phiên cũ: registry uuid↔StringeeCall2, pending
        // answer/reject trong CallKeep, màn gọi gốc còn treo — để sót sang phiên
        // user mới là answer/reject bị route lạc.
        clearCalls();
        resetCallKeepState();
        resetCall();
      })();
    }
    prevStatusRef.current = status;
  }, [status]);
};
