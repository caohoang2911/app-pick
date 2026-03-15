import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';

export type { BarcodeScanningResult } from 'expo-camera';

const codeAvailable: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_e',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'code128',
  'upc_a',
];

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  isQRScanner?: boolean;
};

const deviceWidth = Dimensions.get('screen').width;
const deviceHeight = Dimensions.get('screen').height;

const SCAN_AREA_SCALE = 0.5;
const SCAN_SQUARE_SIZE = Math.min(deviceWidth, deviceHeight) * SCAN_AREA_SCALE;

export type ScanRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getScanRegion(isQRScanner: boolean): ScanRegion {
  const width = SCAN_SQUARE_SIZE;
  const height = SCAN_SQUARE_SIZE / (isQRScanner ? 1 : 2);
  return {
    x: deviceWidth / 2 - width / 2,
    y: deviceHeight / 2 - height / 2,
    width,
    height,
  };
}

// Pre-compute để tránh tính lại mỗi render
const QR_SCAN_REGION = getScanRegion(true);
const BARCODE_SCAN_REGION = getScanRegion(false);

function isBarcodeInScanRegion(
  result: BarcodeScanningResult,
  region: ScanRegion,
): boolean {
  let cx: number;
  let cy: number;
  let isNormalized = false;

  const bounds = result.bounds;
  const points = result.cornerPoints;

  if (
    bounds?.origin &&
    bounds?.size &&
    bounds.size.width > 0 &&
    bounds.size.height > 0
  ) {
    cx = bounds.origin.x + bounds.size.width / 2;
    cy = bounds.origin.y + bounds.size.height / 2;
    isNormalized = bounds.origin.x <= 1 && bounds.origin.y <= 1;
  } else if (points?.length) {
    cx = points.reduce((s, p) => s + p.x, 0) / points.length;
    cy = points.reduce((s, p) => s + p.y, 0) / points.length;
    isNormalized = points.some((p) => p.x <= 1 && p.y <= 1);
  } else {
    return false;
  }

  if (isNormalized) {
    const rx = region.x / deviceWidth;
    const ry = region.y / deviceHeight;
    const rw = region.width / deviceWidth;
    const rh = region.height / deviceHeight;
    return cx >= rx && cx <= rx + rw && cy >= ry && cy <= ry + rh;
  }
  return (
    cx >= region.x &&
    cx <= region.x + region.width &&
    cy >= region.y &&
    cy <= region.y + region.height
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScannerLayout – clipPathId stable (không dùng Date.now()) để tránh SVG flicker
// ─────────────────────────────────────────────────────────────────────────────
const ScannerLayout = React.memo(
  ({
    onClose,
    isQRScanner,
    onToggleScanner,
    scanRegion,
  }: {
    onClose: () => void;
    isQRScanner?: boolean;
    onToggleScanner?: () => void;
    scanRegion: ScanRegion;
  }) => {
    const {
      x: holeX,
      y: holeY,
      width: holeWidth,
      height: holeHeight,
    } = scanRegion;
    // ID stable, không dùng Date.now() – tránh re-render SVG mỗi frame
    const clipPathId = isQRScanner ? 'clip-qr' : 'clip-barcode';

    return (
      <View style={styles.layout}>
        <Svg height="100%" width="100%">
          <Defs>
            <ClipPath id={clipPathId}>
              <Rect width="100%" height="100%" />
              <Rect x={holeX} y={holeY} width={holeWidth} height={holeHeight} />
            </ClipPath>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            clipPath={`url(#${clipPathId})`}
          />
          <Rect
            x={holeX}
            y={holeY}
            width={holeWidth}
            height={holeHeight}
            stroke="white"
            strokeWidth={3}
            fill="transparent"
          />
        </Svg>

        <View
          style={[
            styles.currentScannerTextContainer,
            { top: holeY + holeHeight + 10 },
          ]}
        >
          <Text style={styles.currentScannerText}>
            {isQRScanner ? 'QR Code' : 'Barcode'}
          </Text>
        </View>

        <View className="ml-auto absolute top-14 right-5 z-10">
          <Pressable onPress={onClose} hitSlop={15}>
            <AntDesign name="closecircleo" size={20} color="white" />
          </Pressable>
        </View>

        <View className="absolute left-1/2 -translate-x-1/2 bottom-14 z-10">
          <Pressable onPress={onToggleScanner} style={styles.toggleButton}>
            <View style={styles.toggleButtonContent}>
              <Ionicons name="swap-horizontal" size={16} color="white" />
              <Text style={styles.toggleButtonText}>
                {isQRScanner ? 'Chuyển sang Barcode' : 'Chuyển sang QR Code'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ScannerBox
// ─────────────────────────────────────────────────────────────────────────────
const ScannerBox = ({
  visible,
  onDestroy,
  onSuccessBarcodeScanned,
  isQRScanner = true,
}: Props) => {
  const { permission, facing, requestPermission } = useCarmera();
  const [currentScannerType, setCurrentScannerType] = useState(isQRScanner);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  /**
   * Dùng ref cho callbacks để tránh stale closure trong handleBarcodeScanned.
   * handleBarcodeScanned có thể được capture bởi CameraView native side,
   * ref đảm bảo luôn gọi đúng phiên bản mới nhất.
   */
  const onDestroyRef = useRef(onDestroy);
  onDestroyRef.current = onDestroy;
  const onSuccessRef = useRef(onSuccessBarcodeScanned);
  onSuccessRef.current = onSuccessBarcodeScanned;

  useEffect(() => {
    setCurrentScannerType(isQRScanner);
  }, [isQRScanner]);

  useEffect(() => {
    if (!visible) setIsCameraReady(false);
  }, [visible]);

  const handleRequestPermission = useCallback(() => {
    if (Platform.OS === 'ios' && permission?.granted) {
      requestPermission();
    } else {
      Linking.openSettings();
    }
  }, [permission?.granted, requestPermission]);

  const handleToggleScanner = useCallback(() => {
    /**
     * FIX: Reset isCameraReady khi toggle mode.
     * Khi barcodeTypes thay đổi, CameraView reinitialize scanner bên dưới.
     * Nếu không reset, onBarcodeScanned vẫn active trong lúc camera đang reset
     * → có thể fire với barcode types cũ hoặc không fire được do internal state mismatch.
     */
    setIsCameraReady(false);
    setCurrentScannerType((prev) => !prev);
  }, []);

  const scanRegion = currentScannerType ? QR_SCAN_REGION : BARCODE_SCAN_REGION;

  const codeAvailableForScanner = useMemo<BarcodeType[]>(() => {
    return currentScannerType ? ['qr'] : codeAvailable;
  }, [currentScannerType]);

  /**
   * FIX CHÍNH: Bỏ scanRegion ra khỏi deps, dùng ref thay thế.
   *
   * Vấn đề cũ: handleBarcodeScanned phụ thuộc scanRegion trong deps.
   * Khi toggle mode → scanRegion thay đổi → handleBarcodeScanned tạo instance mới
   * → CameraView nhận prop onBarcodeScanned mới → trigger re-setup scanner nội bộ
   * → trong khoảng thời gian re-setup đó, scan không hoạt động.
   *
   * Fix: scanRegion đưa vào ref, callback hoàn toàn stable (empty deps).
   */
  const scanRegionRef = useRef(scanRegion);
  scanRegionRef.current = scanRegion;

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (!isBarcodeInScanRegion(result, scanRegionRef.current)) return;
    onDestroyRef.current?.();
    onSuccessRef.current?.(result);
  }, []); // empty deps → callback stable hoàn toàn, không bao giờ tạo instance mới

  if (!visible) return null;
  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container} className="px-4">
        <Text className="text-center">
          Bạn không có quyền truy cập vào camera
        </Text>
        <View className="self-center flex-row justify-center mt-4 gap-3">
          <Button onPress={onDestroy} variant="secondary" label="Trở lại" />
          <Button onPress={handleRequestPermission} label="Yêu cầu truy cập" />
        </View>
      </View>
    );
  }

  return (
    <Portal>
      <View style={styles.fullScreenContainer}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={() => setIsCameraReady(true)}
            /**
             * Chỉ bật onBarcodeScanned sau khi camera sẵn sàng.
             * Quan trọng: handleBarcodeScanned stable → CameraView không re-setup
             * scanner mỗi lần parent re-render.
             */
            onBarcodeScanned={isCameraReady ? handleBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: codeAvailableForScanner,
            }}
          >
            <ScannerLayout
              onClose={onDestroy!}
              isQRScanner={currentScannerType}
              onToggleScanner={handleToggleScanner}
              scanRegion={scanRegion}
            />
          </CameraView>
          {!isCameraReady && <View style={styles.cameraLoadingOverlay} />}
        </View>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 10,
    position: 'absolute',
    backgroundColor: 'white',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  layout: {
    position: 'absolute',
    width: deviceWidth,
    height: deviceHeight,
    backgroundColor: 'transparent',
    zIndex: 15,
  },
  toggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentScannerTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  currentScannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default React.memo(ScannerBox);
