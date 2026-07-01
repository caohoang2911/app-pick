import messaging from '@react-native-firebase/messaging';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/core';
import {
  configureVoipPush,
  connectStringee,
  disconnectStringee,
  ensurePhoneAccountEnabled,
  registerStringeePush,
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
      await setupCallKeep();
      if (cancelled) return;
      await connectStringee(userId);
      if (cancelled) return;

      if (Platform.OS === 'ios') {
        // iOS: VoIP token được đăng ký với Stringee qua listener PushKit.
        configureVoipPush();
      } else {
        // Android: managed ConnectionService cần "tài khoản gọi" được BẬT thì
        // cuộc gọi nền/kill mới hiện được. Kiểm tra + mở cài đặt nếu chưa bật.
        await ensurePhoneAccountEnabled();
        if (cancelled) return;

        // Android: dùng FCM token để registerPush (isVoip = false).
        try {
          const fcmToken = await messaging().getToken();
          if (cancelled) return;
          androidTokenRef.current = fcmToken;
          await registerStringeePush(fcmToken, false);
        } catch (e) {
          console.warn('[Stringee] android push register failed', e);
        }
        if (cancelled) return;

        // Android: FCM token có thể xoay vòng (cài lại app, clear data, khôi phục
        // máy, hết hạn…). Không đăng ký lại token mới ⇒ Stringee vẫn đẩy tới token
        // cũ đã chết ⇒ mất chuông khi background/killed. Lắng nghe refresh để
        // registerPush token mới + cập nhật ref cho lần unregister lúc đăng xuất.
        unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
          console.log('[Stringee] FCM token refreshed → re-registerPush');
          androidTokenRef.current = newToken;
          void registerStringeePush(newToken, false);
        });
        if (cancelled) unsubscribeTokenRefresh();
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
    };
  }, [status, userInfo?.username]);

  // Ngắt kết nối khi đăng xuất.
  useEffect(() => {
    if (prevStatusRef.current === 'signIn' && status === 'signOut') {
      const token = androidTokenRef.current;
      if (token) void unregisterStringeePush(token);
      disconnectStringee();
      resetCall();
    }
    prevStatusRef.current = status;
  }, [status]);
};
