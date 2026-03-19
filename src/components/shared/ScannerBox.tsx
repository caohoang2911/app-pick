import {
  Barcode,
  BarcodeType,
  useBarcodeScanner,
} from '@mgcrea/vision-camera-barcode-scanner';
import { Portal } from '@gorhom/portal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import {
  Camera,
  CameraDevice,
  useCameraDevice,
} from 'react-native-vision-camera';
import { BarcodeScanningResult, ScanRegion } from '~/src/types/scanner';
import { Button } from '../Button';
import useCarmera from '~/src/core/hooks/useCarmera';
import ScannerLayout from './ScannerBoxLayout';
import {
  BARCODE_SCAN_REGION,
  BARCODE_VISION_REGION,
  QR_SCAN_REGION,
  QR_VISION_REGION,
} from './scannerRegion';

export type { BarcodeScanningResult, ScanRegion } from '~/src/types/scanner';

const codeAvailableBarcode: BarcodeType[] = [
  'ean-13',
  'ean-8',
  'upc-e',
  'code-39',
  'code-93',
  'itf',
  'codabar',
  'code-128',
  'upc-a',
];

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  isQRScanner?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// ScannerBox – main component (1 Camera, đổi props khi toggle → không destroy)
// ─────────────────────────────────────────────────────────────────────────────
const ScannerBox = ({
  visible,
  onDestroy,
  onSuccessBarcodeScanned,
  isQRScanner = true,
}: Props) => {
  const { permission, requestPermission } = useCarmera();
  const [currentScannerType, setCurrentScannerType] = useState(isQRScanner);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  /** scannedShared: guard chống double-fire, đọc được từ worklet thread */
  const scannedShared = useSharedValue(false);

  /**
   * Refs luôn trỏ tới props mới nhất, cập nhật mỗi render.
   * Dùng để handleBarcodeScanned có empty deps (hoàn toàn stable) mà vẫn gọi
   * đúng callback hiện tại → tránh stale closure khi onDestroy/onSuccessBarcodeScanned
   * thay đổi reference do parent không wrap useCallback hoặc deps thay đổi.
   */
  const onDestroyRef = useRef(onDestroy);
  onDestroyRef.current = onDestroy;
  const onSuccessRef = useRef(onSuccessBarcodeScanned);
  onSuccessRef.current = onSuccessBarcodeScanned;

  useEffect(() => {
    setCurrentScannerType(isQRScanner);
  }, [isQRScanner]);

  useEffect(() => {
    /** Reset scannedShared trên MỌI thay đổi của visible (cả mở lẫn đóng).
     * Đảm bảo scanner không bị stuck nếu có edge case nào đó khi session trước
     * chưa reset được (exception trong callback, timing issue, v.v.) */
    scannedShared.value = false;
    if (!visible) {
      setIsCameraReady(false);
    }
  }, [visible]);

  const handleRequestPermission = useCallback(() => {
    if (Platform.OS === 'ios' && permission?.granted) {
      requestPermission();
    } else {
      Linking.openURL('app-settings:');
    }
  }, [permission?.granted, requestPermission]);

  const handleToggleScanner = useCallback(() => {
    // Chỉ reset guard khi đổi mode. Không set isCameraReady(false) vì Camera không remount
    // → onInitialized không gọi lại → overlay đen sẽ không tắt.
    scannedShared.value = false;
    setCurrentScannerType((prev) => !prev);
  }, []);

  /** Stable callback truyền vào QRCamera/BarcodeCamera.
   * Khi Camera native báo đã khởi tạo xong → ẩn overlay đen. */
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  /** handleBarcodeScanned hoàn toàn stable (empty deps) nhờ dùng refs.
   * Frame processor của @mgcrea capture callback 1 lần tại mount →
   * dùng ref.current đảm bảo luôn gọi đúng phiên bản mới nhất của props. */
  const handleBarcodeScanned = useRunOnJS((barcode: Barcode) => {
    const result: BarcodeScanningResult = {
      type: barcode.type,
      data: barcode.value ?? '',
      cornerPoints: barcode.cornerPoints,
    };
    onDestroyRef.current?.();
    onSuccessRef.current?.(result);
  }, []);

  const { props: qrCameraProps } = useBarcodeScanner({
    fps: 3,
    barcodeTypes: ['qr'],
    regionOfInterest: QR_VISION_REGION,
    scanMode: 'continuous',
    onBarcodeScanned: (barcodes) => {
      'worklet';
      if (scannedShared.value || barcodes.length === 0) return;
      scannedShared.value = true;
      handleBarcodeScanned(barcodes[0]);
    },
  });

  const { props: barcodeCameraProps } = useBarcodeScanner({
    fps: 3,
    barcodeTypes: codeAvailableBarcode,
    regionOfInterest: BARCODE_VISION_REGION,
    scanMode: 'continuous',
    onBarcodeScanned: (barcodes) => {
      'worklet';
      if (scannedShared.value || barcodes.length === 0) return;
      scannedShared.value = true;
      handleBarcodeScanned(barcodes[0]);
    },
  });

  const handleTapFocus = useCallback(async (e: any) => {
    try {
      const { locationX: x, locationY: y } = e.nativeEvent;
      await cameraRef.current?.focus({ x, y });
    } catch (_) {
      // focus có thể throw nếu device không hỗ trợ, bỏ qua
    }
  }, []);

  const scanRegion = currentScannerType ? QR_SCAN_REGION : BARCODE_SCAN_REGION;

  // ✅ Render nội dung bên trong Portal dựa theo các trạng thái
  const renderContent = () => {
    if (!permission) return <View />;

    if (!permission.granted) {
      return (
        <View style={styles.container} className="px-4">
          <Text className="text-center">
            Bạn không có quyền truy cập vào camera
          </Text>
          <View className="self-center flex-row justify-center mt-4 gap-3">
            <Button onPress={onDestroy} variant="secondary" label="Trở lại" />
            <Button
              onPress={handleRequestPermission}
              label="Yêu cầu truy cập"
            />
          </View>
        </View>
      );
    }

    if (!device) return <View />;

    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.cameraContainer}>
          <Pressable style={styles.camera} onPress={handleTapFocus}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device as CameraDevice}
              isActive={visible || false}
              onInitialized={handleCameraReady}
              videoStabilizationMode="off"
              photoHdr={false}
              videoHdr={false}
              {...(currentScannerType ? qrCameraProps : barcodeCameraProps)}
            />
          </Pressable>

          <ScannerLayout
            onClose={onDestroy!}
            isQRScanner={currentScannerType}
            onToggleScanner={handleToggleScanner}
            scanRegion={scanRegion}
          />

          {!isCameraReady && <View style={styles.cameraLoadingOverlay} />}
        </View>
      </View>
    );
  };

  // ✅ Portal luôn mounted, chỉ ẩn/hiện nội dung bên trong
  // Tránh Portal register/unregister gây remount toàn bộ tree
  return <Portal>{visible ? renderContent() : null}</Portal>;
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
});

export default React.memo(ScannerBox);
