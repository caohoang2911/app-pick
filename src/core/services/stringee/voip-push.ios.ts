import VoipPushNotification from 'react-native-voip-push-notification';

import { registerStringeePush } from './stringee-client';

let _isConfigured = false;
let _voipToken: string | null = null;

/**
 * Cấu hình PushKit (iOS): lấy VoIP token và đăng ký với Stringee để nhận
 * cuộc gọi khi app ở background/bị kill. Việc report cuộc gọi tới CallKit
 * khi nhận VoIP push được làm ở native (AppDelegate, qua config plugin).
 */
export const configureVoipPush = (): void => {
  if (_isConfigured) return;
  _isConfigured = true;

  VoipPushNotification.addEventListener('register', (token) => {
    _voipToken = token;
    void registerStringeePush(token, true); // isVoip = true
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
  });

  VoipPushNotification.registerVoipToken();
};

export const getVoipToken = (): string | null => _voipToken;
