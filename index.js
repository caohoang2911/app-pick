// Entry point tuỳ biến cho expo-router.
// Đăng ký handler nhận FCM background/quit (cuộc gọi Stringee + thông báo)
// TRƯỚC khi expo-router khởi động, để hoạt động cả khi app bị kill (headless JS).
import { registerBackgroundCallHandler } from './src/core/services/stringee/register-background-call-handler';

registerBackgroundCallHandler();

// expo-router/entry tự gọi registerRootComponent với context routing.
require('expo-router/entry');
