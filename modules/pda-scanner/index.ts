// Cầu JS cho native module `PdaScanner` — nhận sự kiện quét mã vạch từ đầu đọc
// laser của máy PDA Android (đa hãng: Urovo / Zebra DataWedge / Honeywell /
// Chainway / Newland / Unitech / iData...). Native đăng ký BroadcastReceiver ở
// runtime rồi bắn event "onScan" (xem android/.../PdaScannerModule.kt).
//
// Module CHỈ có mặt trên Android (platforms: ["android"] trong
// expo-module.config.json). Trên iOS / bản build cũ chưa có module,
// `requireOptionalNativeModule` trả về null và mọi hàm ở đây thành no-op.
import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/** Payload của event "onScan" do native gửi xuống. */
export type PdaScanEvent = {
  /** Chuỗi mã vạch đã giải mã. */
  data: string;
  /** Action broadcast đã khớp (để debug / biết máy đang dùng cơ chế nào). */
  action?: string;
  /** Loại mã (symbology) nếu máy có gửi kèm. */
  type?: string;
};

type PdaScannerNativeModule = {
  isAvailable?: () => boolean;
};

type PdaScanSubscription = { remove: () => void };

const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<PdaScannerNativeModule>('PdaScanner')
    : null;

const emitter = nativeModule ? new EventEmitter(nativeModule as any) : null;

/** True khi bản build hiện tại có native module PdaScanner (Android + đã prebuild/rebuild). */
export const isPdaScannerAvailable = nativeModule != null;

/**
 * Lắng nghe sự kiện quét từ máy PDA. Trả về subscription — nhớ gọi `.remove()`
 * khi unmount. No-op (trả subscription rỗng) nếu native module không có mặt.
 */
export function addPdaScanListener(
  listener: (event: PdaScanEvent) => void,
): PdaScanSubscription {
  if (!emitter) return { remove: () => {} };
  return emitter.addListener('onScan', listener);
}
