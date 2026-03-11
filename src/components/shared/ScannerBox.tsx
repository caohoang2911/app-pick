import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

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

const codeAvailable = [
  // 'aztec',
  'ean13',
  'ean8',
  //pdf417
  'upc_e',
  //datamatrix
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

/** Kích thước vùng quét (khung SVG). Thu nhỏ để dễ nhắm đúng 1 mã khi có nhiều barcode/QR gần nhau. */
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

/** Kiểm tra barcode có nằm trong vùng quét không (bounds có thể là pixel hoặc normalized 0–1). */
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

const ScannerLayout = ({
  onClose,
  isQRScanner,
  onToggleScanner,
  scanRegion,
}: {
  onClose: any;
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

  const clipPathId = `clip-${isQRScanner ? 'qr' : 'barcode'}-${Date.now()}`;
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
};

const ScannerBox = ({
  visible,
  onDestroy,
  onSuccessBarcodeScanned,
  isQRScanner = true,
}: Props) => {
  const { permission, facing, requestPermission } = useCarmera();
  const [currentScannerType, setCurrentScannerType] = useState(isQRScanner);
  const [scannerKey, setScannerKey] = useState(0);
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    setCurrentScannerType(isQRScanner);
  }, [isQRScanner]);

  useEffect(() => {
    if (visible) {
      setIsCameraVisible(true);
    }
  }, [visible]);

  const handleRequestPermission = useCallback(() => {
    if (Platform.OS == 'ios' && permission?.granted) {
      requestPermission();
    } else {
      Linking.openURL('app-settings:');
    }
  }, [permission?.granted, requestPermission]);

  const handleToggleScanner = useCallback(() => {
    console.log(
      '🔄 Toggle to:',
      !currentScannerType ? 'QR Mode' : 'Barcode Mode',
    );

    setIsCameraVisible(false);

    setTimeout(() => {
      setCurrentScannerType((prev) => !prev);
      setScannerKey((prev) => prev + 1);
      setIsCameraVisible(true);
    }, 50);
  }, [currentScannerType]);

  const scanRegion = useMemo(
    () => getScanRegion(currentScannerType),
    [currentScannerType],
  );

  const codeAvailableForScanner = useMemo(() => {
    if (currentScannerType) {
      console.log('📸 Camera: QR Mode');
      return ['qr'];
    }
    console.log('📸 Camera: Barcode Mode (All types)');
    return codeAvailable;
  }, [currentScannerType]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isBarcodeInScanRegion(result, scanRegion)) return;
      console.log('✅ Quét thành công:', result.type, '-', result.data);
      onDestroy?.();
      onSuccessBarcodeScanned?.(result);
    },
    [onDestroy, onSuccessBarcodeScanned, scanRegion],
  );

  if (!visible) return <></>;

  if (!permission) {
    return <View />;
  }

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
          {isCameraVisible ? (
            <CameraView
              key={`camera-${currentScannerType ? 'qr' : 'barcode'}-${scannerKey}`}
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: codeAvailableForScanner as BarcodeType[],
              }}
            >
              <ScannerLayout
                key={`scanner-${currentScannerType ? 'qr' : 'barcode'}-${scannerKey}`}
                onClose={onDestroy}
                isQRScanner={currentScannerType}
                onToggleScanner={handleToggleScanner}
                scanRegion={scanRegion}
              />
            </CameraView>
          ) : (
            <View style={styles.camera} />
          )}
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
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
