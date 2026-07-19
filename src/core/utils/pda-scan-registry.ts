import { BarcodeScanningResult } from '~/src/types/scanner';

// Sổ đăng ký handler quét cho máy PDA (đầu đọc laser). Khác với camera (mỗi màn
// tự mở ScannerBox rồi truyền onSuccessBarcodeScanned), sự kiện quét PDA đến
// TOÀN CỤC (không cần mở camera / không cần focus input). Registry này giữ danh
// sách handler của các màn ĐANG focus để `usePdaScan` biết bắn mã vào đâu.
//
// Dùng dạng STACK: handler đăng ký sau cùng (màn focus mới nhất) nằm trên đỉnh
// và nhận mã. Điều này xử lý gọn trường hợp 2 màn [code] cùng mount (router.push
// từ push notification) — chỉ màn đang focus đăng ký (xem usePdaScanTarget gate
// theo useIsFocused), phần chồng lấn lúc chuyển màn thì đỉnh-stack thắng.
type PdaScanHandler = (result: BarcodeScanningResult) => void;

type PdaScanTarget = { id: number; handler: PdaScanHandler };

let sequence = 0;
const targets: PdaScanTarget[] = [];

/** Đăng ký handler và nhận về id để huỷ đăng ký. */
export function registerPdaScanTarget(handler: PdaScanHandler): number {
  const id = ++sequence;
  targets.push({ id, handler });
  return id;
}

export function unregisterPdaScanTarget(id: number): void {
  const index = targets.findIndex((target) => target.id === id);
  if (index !== -1) targets.splice(index, 1);
}

/** Bắn mã quét tới handler trên đỉnh stack (màn focus mới nhất). Trả về false nếu không có handler nào. */
export function dispatchPdaScan(result: BarcodeScanningResult): boolean {
  const target = targets[targets.length - 1];
  if (!target) return false;
  target.handler(result);
  return true;
}

export function hasPdaScanTarget(): boolean {
  return targets.length > 0;
}
