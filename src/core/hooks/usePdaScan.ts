import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  addPdaScanListener,
  isPdaScannerAvailable,
} from '~/modules/pda-scanner';
import { dispatchPdaScan } from '~/src/core/utils/pda-scan-registry';

// Chống double-fire: bỏ qua CÙNG một mã quét lặp lại trong khoảng này. Một số
// máy PDA bắn 2 broadcast cho 1 lần quét, hoặc người dùng bóp cò 2 lần liên
// tiếp. Camera cũ tự đóng sau 1 lần quét nên không cần; PDA "luôn bật" thì cần.
const DEDUPE_WINDOW_MS = 400;

/**
 * Lắng nghe sự kiện quét TOÀN CỤC từ native `PdaScanner` (BroadcastReceiver đa
 * hãng) và route mã tới handler của màn đang focus (pda-scan-registry) —
 * tái dùng đúng handler mà ScannerBox (camera) đang dùng, nên không cần đổi
 * logic từng màn.
 *
 * Chỉ chạy Android (máy PDA là thiết bị Android). Mount MỘT lần ở AuthWrapper.
 */
export function usePdaScan(): void {
  useEffect(() => {
    // Cho biết bản build có native module chưa (available=false ⇒ chưa prebuild+build lại).
    if (__DEV__) {
      console.log(
        `[PdaScan] mount — platform=${Platform.OS} available=${isPdaScannerAvailable}`,
      );
    }
    if (Platform.OS !== 'android' || !isPdaScannerAvailable) return;

    let lastData = '';
    let lastTime = 0;

    const subscription = addPdaScanListener((event) => {
      const data = (event?.data ?? '').trim();
      if (!data) return;

      // Chống trùng: máy quét chế độ "continuous" bắn cùng 1 mã hàng chục lần/giây.
      // Dùng cửa sổ TRƯỢT — cập nhật mốc thời gian ngay cả khi bỏ qua — để suốt
      // lúc giữ cò trên 1 mã chỉ dispatch ĐÚNG 1 lần (không re-fire mỗi 400ms →
      // hết dội re-render). Chỉ nhận lại mã đó sau khi ngừng quét > cửa sổ.
      const now = Date.now();
      if (data === lastData && now - lastTime < DEDUPE_WINDOW_MS) {
        lastTime = now;
        return;
      }
      lastData = data;
      lastTime = now;

      if (__DEV__) console.log('[PdaScan] scan:', data);

      // Dựng lại shape BarcodeScanningResult để handler các màn dùng y hệt camera.
      dispatchPdaScan({ type: event.type || 'pda', data });
    });

    return () => subscription.remove();
  }, []);
}
