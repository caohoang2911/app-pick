import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  registerPdaScanTarget,
  unregisterPdaScanTarget,
} from '~/src/core/utils/pda-scan-registry';
import { BarcodeScanningResult } from '~/src/types/scanner';

/**
 * Đăng ký handler quét cho màn ĐANG focus để nhận mã từ máy PDA (đầu đọc laser)
 * — tái dùng đúng handler mà `<ScannerBox onSuccessBarcodeScanned={...}>` của
 * màn đó đang dùng cho camera. Nhờ vậy người dùng có thể quét bằng tia laser mà
 * KHÔNG cần mở camera, và không phải sửa logic từng màn.
 *
 * Gate theo `useIsFocused` để 2 màn `[code]` cùng mount (mở từ push
 * notification) không tranh nhau — chỉ màn focus đăng ký. Xem memory:
 * global-store-multi-mounted-screen-pattern.
 *
 * Handler được gọi qua ref nên luôn là bản mới nhất; không cần memo hoá handler
 * ở phía màn gọi để tránh đăng ký lại liên tục.
 *
 * @param handler nhận `BarcodeScanningResult` giống hệt callback của camera.
 * @param enabled tắt tạm thời khi cần (mặc định bật).
 */
export function usePdaScanTarget(
  handler: (result: BarcodeScanningResult) => void,
  enabled: boolean = true,
): void {
  const isFocused = useIsFocused();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!enabled || !isFocused) return;

    const id = registerPdaScanTarget((result) => handlerRef.current(result));
    return () => unregisterPdaScanTarget(id);
  }, [enabled, isFocused]);
}
