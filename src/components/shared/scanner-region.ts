import { Dimensions } from 'react-native';
import type { ScanRegion } from '~/src/types/scanner';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('screen');

/** 0.5 * 1.2 = 0.6 — tăng 20% khung nhìn và vùng quét (đồng bộ hole + getScanRegion). */
const SCAN_AREA_SCALE = 0.5 * 1.2;
const SCAN_SQUARE_SIZE = Math.min(deviceWidth, deviceHeight) * SCAN_AREA_SCALE;

export function getScanRegion(isQRScanner: boolean): ScanRegion {
  const width = SCAN_SQUARE_SIZE;
  const height = SCAN_SQUARE_SIZE / (isQRScanner ? 1 : 2);
  return {
    x: deviceWidth / 2 - width / 2,
    y: deviceHeight / 2 - height / 2,
    width,
    height,
  };
}

/**
 * Chuyển đổi tọa độ từ portrait screen space sang iOS Vision landscape space.
 * iOS Vision framework xử lý camera frame ở landscape orientation (native sensor).
 */
export function toVisionRegion(region: ScanRegion) {
  const px = region.x / deviceWidth;
  const py = region.y / deviceHeight;
  const pw = region.width / deviceWidth;
  const ph = region.height / deviceHeight;
  return { x: py, y: px, width: ph, height: pw };
}

export const SCAN_REGION_DIMENSIONS = {
  deviceWidth,
  deviceHeight,
} as const;

// Pre-compute stable region values (không đổi theo lifecycle)
export const QR_SCAN_REGION = getScanRegion(true);
export const BARCODE_SCAN_REGION = getScanRegion(false);
export const QR_VISION_REGION = toVisionRegion(QR_SCAN_REGION);
export const BARCODE_VISION_REGION = toVisionRegion(BARCODE_SCAN_REGION);
