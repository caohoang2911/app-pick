import {
  Barcode,
  BarcodeType,
  useBarcodeScanner,
} from '@mgcrea/vision-camera-barcode-scanner';
import { Portal } from '@gorhom/portal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
// ScannerBox – Camera NEVER unmounts once device is ready.
// Visibility is controlled via isActive + display:none to prevent
// JSI/Worklet destructor crashes (EXC_BAD_ACCESS KERN_INVALID_ADDRESS).
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
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const mountedRef = useRef(true);
  const closeRequestedRef = useRef(false);
  // FIX: Track if Camera has ever initialized — onInitialized only fires once
  // since Camera never unmounts. Subsequent opens skip waiting for it.
  const cameraHasInitializedRef = useRef(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always point to latest props — avoids stale closures inside worklet callbacks
  const onDestroyRef = useRef(onDestroy);
  onDestroyRef.current = onDestroy;
  const onSuccessRef = useRef(onSuccessBarcodeScanned);
  onSuccessRef.current = onSuccessBarcodeScanned;

  // ── Shared values (readable on worklet thread) ────────────────────────────
  /** Prevents double-fire from frame processor */
  const scannedShared = useSharedValue(false);
  /** Gates the frame processor — set false immediately on close/hide */
  const isActiveShared = useSharedValue(false);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      // FIX: Disable worklet gate BEFORE component unmounts so the frame
      // processor stops touching JSI objects while they are being destroyed.
      isActiveShared.value = false;
      scannedShared.value = false;
    };
  }, []);

  useEffect(() => {
    setCurrentScannerType(isQRScanner);
  }, [isQRScanner]);

  useEffect(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

    scannedShared.value = false;
    closeRequestedRef.current = false;

    if (visible) {
      isActiveShared.value = true;
      overlayOpacity.setValue(1);

      if (cameraHasInitializedRef.current) {
        // FIX: Camera already initialized on first open — onInitialized won't
        // fire again. Dismiss overlay after a short delay directly.
        overlayTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setIsCameraReady(true);
        }, 300);
      } else {
        // First open — wait for onInitialized to fire normally
        setIsCameraReady(false);
      }
    } else {
      // FIX: Disable worklet gate FIRST, then reset UI state.
      isActiveShared.value = false;
      setIsCameraReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(overlayOpacity, {
      toValue: isCameraReady ? 0 : 1,
      duration: isCameraReady ? 180 : 120,
      useNativeDriver: true,
    }).start();
  }, [isCameraReady, visible]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRequestPermission = useCallback(() => {
    if (Platform.OS === 'ios' && permission?.granted) {
      requestPermission();
    } else {
      Linking.openURL('app-settings:');
    }
  }, [permission?.granted, requestPermission]);

  const handleToggleScanner = useCallback(() => {
    scannedShared.value = false;
    setCurrentScannerType((prev) => !prev);
  }, []);

  // FIX: onInitialized only fires on first mount since Camera never unmounts.
  // Mark the flag so subsequent opens know to dismiss overlay themselves.
  const handleCameraReady = useCallback(() => {
    overlayTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      cameraHasInitializedRef.current = true;
      setIsCameraReady(true);
    }, 200);
  }, []);

  const handleTapFocus = useCallback(async (e: any) => {
    try {
      const { locationX: x, locationY: y } = e.nativeEvent;
      await cameraRef.current?.focus({ x, y });
    } catch (_) {
      // Device may not support tap-to-focus — safe to ignore
    }
  }, []);

  /**
   * FIX: useRunOnJS callback is stable (empty deps) via refs.
   * We also guard with mountedRef and closeRequestedRef to ensure
   * this never fires after the component has begun unmounting.
   */
  const handleBarcodeScanned = useRunOnJS((barcode: Barcode) => {
    if (!mountedRef.current || closeRequestedRef.current) return;

    closeRequestedRef.current = true;
    // Disable gate immediately so worklet thread stops processing
    isActiveShared.value = false;

    const result: BarcodeScanningResult = {
      type: barcode.type,
      data: barcode.value ?? '',
      cornerPoints: barcode.cornerPoints,
    };

    onSuccessRef.current?.(result);

    // Allow native/worklet callbacks to flush before parent closes scanner
    setTimeout(() => {
      if (!mountedRef.current) return;
      onDestroyRef.current?.();
    }, 0);
  }, []);

  // ── Barcode scanner hooks ─────────────────────────────────────────────────
  // FIX: Both hooks are always called (no conditional hook calls).
  // The active one is chosen at render time via spread props.
  const { props: qrCameraProps } = useBarcodeScanner({
    fps: 3,
    barcodeTypes: ['qr'],
    regionOfInterest: QR_VISION_REGION,
    scanMode: 'continuous',
    onBarcodeScanned: (barcodes) => {
      'worklet';
      if (!isActiveShared.value || scannedShared.value || barcodes.length === 0)
        return;
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
      if (!isActiveShared.value || scannedShared.value || barcodes.length === 0)
        return;
      scannedShared.value = true;
      handleBarcodeScanned(barcodes[0]);
    },
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const scanRegion = currentScannerType ? QR_SCAN_REGION : BARCODE_SCAN_REGION;

  // ── Render ────────────────────────────────────────────────────────────────
  /**
   * FIX: Camera is ALWAYS mounted once device + permission are ready.
   * We never conditionally unmount it — that's the root cause of the
   * JSI destructor crash. Instead:
   *   • display:'none'  hides the view without unmounting
   *   • isActive=false  pauses the camera session on the native side
   *   • isActiveShared  stops the worklet frame processor immediately
   *
   * Permission-denied UI is rendered separately, outside the Camera tree.
   */
  return (
    <Portal>
      {/* ── Permission denied UI (shown only when visible & no permission) ── */}
      {visible && permission && !permission.granted && (
        <View style={styles.container} className="px-4">
          <Text className="text-center">
            Bạn không có quyền truy cập vào camera
          </Text>
          <View className="self-center flex-row justify-center mt-4 gap-3">
            <Button
              onPress={onDestroyRef.current}
              variant="secondary"
              label="Trở lại"
            />
            <Button
              onPress={handleRequestPermission}
              label="Yêu cầu truy cập"
            />
          </View>
        </View>
      )}

      {/* ── Camera tree — always mounted, hidden via display:'none' ────────
           This is the key fix: Camera is never unmounted while worklets
           may still hold references to JSI objects.                       */}
      {permission?.granted && device ? (
        <View
          style={[
            styles.fullScreenContainer,
            // FIX: display:'none' hides without triggering unmount/destructor
            !visible && styles.hidden,
          ]}
        >
          <View style={styles.cameraContainer}>
            <Pressable style={styles.camera} onPress={handleTapFocus}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                device={device as CameraDevice}
                // FIX: isActive controls the native session — never rely on
                // unmounting the Camera component to "stop" the camera.
                isActive={!!visible}
                onInitialized={handleCameraReady}
                videoStabilizationMode="off"
                photoHdr={false}
                videoHdr={false}
                {...(currentScannerType ? qrCameraProps : barcodeCameraProps)}
              />
            </Pressable>

            <ScannerLayout
              onClose={onDestroyRef.current!}
              isQRScanner={currentScannerType}
              onToggleScanner={handleToggleScanner}
              scanRegion={scanRegion}
            />
          </View>

          {/* Black overlay while camera initialises */}
          <Animated.View
            pointerEvents="none"
            style={[styles.cameraLoadingOverlay, { opacity: overlayOpacity }]}
          />
        </View>
      ) : null}
    </Portal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
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
  // FIX: Use display:'none' instead of conditional render to hide without
  // unmounting — prevents JSI/Worklet destructor (EXC_BAD_ACCESS) crashes.
  hidden: {
    display: 'none',
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
    zIndex: 1000,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default React.memo(ScannerBox);
