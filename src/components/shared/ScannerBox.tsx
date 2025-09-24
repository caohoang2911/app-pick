import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';

const codeAvailable = [
  'aztec',
  'ean13',
  'ean8',
  'qr',
  'pdf417',
  'upc_e',
  'datamatrix',
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

const SCAN_SQUARE_SIZE = deviceWidth - 150;

const ScannerLayout = ({
  onClose,
  isQRScanner,
  onToggleScanner,
}: {
  onClose: any;
  isQRScanner?: boolean;
  onToggleScanner?: () => void;
}) => {
  const holeWidth = SCAN_SQUARE_SIZE;
  const holeHeight = SCAN_SQUARE_SIZE / (isQRScanner ? 1 : 2);
  const holeX = deviceWidth / 2 - holeWidth / 2;
  const holeY = deviceHeight / 2 - holeHeight / 2;
  
  // Create unique ID for ClipPath to force re-render on Android
  const clipPathId = `clip-${isQRScanner ? 'qr' : 'barcode'}-${Date.now()}`;
  return (
    <View style={styles.layout}>
      <Svg height="100%" width="100%">
        <Defs>
          <ClipPath id={clipPathId}>
            {/* phủ toàn màn hình */}
            <Rect width="100%" height="100%" />
            {/* lỗ quét */}
            <Rect x={holeX} y={holeY} width={holeWidth} height={holeHeight} />
          </ClipPath>
        </Defs>

        {/* overlay */}
        <Rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          clipPath={`url(#${clipPathId})`}
        />

         {/* viền trắng quanh lỗ */}
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

       {/* Text hiển thị loại scanner hiện tại */}
       <View style={[styles.currentScannerTextContainer, { top: holeY + holeHeight + 10 }]}>
         <Text style={styles.currentScannerText}>
           {isQRScanner ? 'QR Code' : 'Barcode'}
         </Text>
       </View>

      {/* Nút đóng */}
      <View className="ml-auto absolute top-14 right-5 z-10">
        <Pressable onPress={onClose} hitSlop={15}>
          <AntDesign name="closecircleo" size={20} color="white" />
        </Pressable>
      </View>

      {/* Nút chuyển đổi scanner */}
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
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [scannerKey, setScannerKey] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Reset state when visibility changes
    setCurrentScannerType(isQRScanner);
    if (visible) {
      setShowLoading(true);
      setIsCameraReady(false);
    }
  }, [visible, isQRScanner]);

  // Preload camera when component mounts
  useEffect(() => {
    if (visible && permission?.granted) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsCameraReady(true);
        setShowLoading(false);
        
        // Animate camera appearance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, permission?.granted, fadeAnim, scaleAnim]);

  const handleRequestPermission = useCallback(() => {
    if (Platform.OS == 'ios' && permission?.granted) {
      Linking.openURL('app-settings:');
    } else {
      requestPermission();
    }
  }, []);

  const handleToggleScanner = useCallback(() => {
    setCurrentScannerType((prev) => !prev);
    // Force re-render of ScannerLayout on Android
    setScannerKey((prev) => prev + 1);
  }, []);

  const codeAvailableForScanner = useMemo(() => {
    if (currentScannerType) {
      return ['qr'];
    }

    return codeAvailable.filter((type) => type !== 'qr');
  }, [currentScannerType]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    setShowLoading(false);
  }, []);

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    onDestroy?.();
    setTimeout(() => {
      onSuccessBarcodeScanned?.(result);
    }, 100);
  }, [onDestroy, onSuccessBarcodeScanned]);

  if (!visible) return <></>;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
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
        {showLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang khởi tạo camera...</Text>
          </View>
        )}
        {isCameraReady && (
          <Animated.View
            style={[
              styles.cameraContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              onBarcodeScanned={handleBarcodeScanned}
              onCameraReady={handleCameraReady}
              barcodeScannerSettings={{
                barcodeTypes: codeAvailableForScanner as BarcodeType[],
              }}
            >
              <ScannerLayout
                key={`scanner-${currentScannerType ? 'qr' : 'barcode'}-${scannerKey}`}
                onClose={onDestroy}
                isQRScanner={currentScannerType}
                onToggleScanner={handleToggleScanner}
              />
            </CameraView>
          </Animated.View>
        )}
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
    backgroundColor: 'transparent',
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
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default React.memo(ScannerBox);
