/** Tương thích với expo-camera BarcodeScanningResult để không đổi logic ở các màn sử dụng. */
export type BarcodeScanningResult = {
  type: string;
  data: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  cornerPoints?: Array<{ x: number; y: number }>;
};

export type ScanRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};
