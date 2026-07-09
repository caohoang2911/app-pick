import messaging from '@react-native-firebase/messaging';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/core';
import {
  configureVoipPush,
  connectStringee,
  disconnectStringee,
  ensureMicPermission,
  ensurePhoneAccountEnabled,
  getVoipToken,
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

        // Xin quyền mic ngay sau đăng nhập — thiếu quyền thì đàm thoại câm
        // (bên kia không nghe thấy app) dù cuộc gọi vẫn kết nối bình thường.
        await ensureMicPermission();
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

  // Ngắt kết nối khi đăng xuất (logout chủ động hoặc bị đá văng vì hết phiên —
  // mọi đường đều đi qua `signOut()` của auth store nên gom xử lý ở đây).
  useEffect(() => {
    if (prevStatusRef.current === 'signIn' && status === 'signOut') {
      void (async () => {
        // unregisterPush để máy này KHÔNG còn nhận push cuộc gọi của account cũ.
        // iOS dùng VoIP token (PushKit), Android dùng FCM token.
        const token =
          Platform.OS === 'ios' ? getVoipToken() : androidTokenRef.current;
        if (token) {
          // PHẢI đợi unregister xong mới disconnect (lệnh đi qua kết nối đang
          // sống). Race timeout phòng socket đã chết → callback không bao giờ về.
          await Promise.race([
            unregisterStringeePush(token),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        }
        androidTokenRef.current = null;
        disconnectStringee();
        resetCall();
      })();
    }
    prevStatusRef.current = status;
  }, [status]);
};
