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
import { BarcodeScanningResult } from '~/src/types/scanner';
import { Button } from '../Button';
import useCarmera from '~/src/core/hooks/useCarmera';
import { useOtaUpdateReadyModal } from '~/src/core/store/ota-update-modal';
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

// Frame-processor throttle for barcode DECODING only — the camera preview
// always renders at full rate regardless. 3 fps felt sluggish to lock onto a
// code; 5 is noticeably snappier at a negligible extra CPU cost.
const SCAN_FPS = 5;

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
  const pendingRestart = useOtaUpdateReadyModal((s) => s.pendingRestart);
  const [currentScannerType, setCurrentScannerType] = useState(isQRScanner);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const mountedRef = useRef(true);
  const closeRequestedRef = useRef(false);
  // Fallback timer that reveals the preview if onPreviewStarted never fires.
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

    if (visible && !pendingRestart) {
      // Start fully black. The overlay is faded out only once the preview
      // delivers its first real frame (onPreviewStarted) — no blind delay and
      // no flash of the previous, frozen frame.
      isActiveShared.value = true;
      setIsCameraReady(false);
      overlayOpacity.setValue(1);

      // Safety net: reveal anyway if onPreviewStarted never arrives (e.g. an
      // edge device that doesn't emit it). Cleared the moment it does fire.
      overlayTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setIsCameraReady(true);
      }, 800);
    } else {
      // Pre-black the overlay NOW so the next open's very first painted frame
      // is already opaque — this is what kills the reopen flash.
      isActiveShared.value = false;
      setIsCameraReady(false);
      overlayOpacity.setValue(1);
    }
  }, [visible, pendingRestart]);

  useEffect(() => {
    // The overlay is forced opaque synchronously above; here we only animate
    // the fade-OUT, and only once the live preview is actually up.
    if (!isCameraReady) return;
    const anim = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [isCameraReady]);

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

  // Fires when the preview renders its FIRST frame after each session start —
  // the exact moment it's safe to fade the black overlay out. Works on every
  // open because the session stops/starts with isActive.
  const handlePreviewStarted = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (mountedRef.current) setIsCameraReady(true);
  }, []);

  // Never leave the user staring at a black overlay if the session errors out.
  const handleCameraError = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (mountedRef.current) setIsCameraReady(true);
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
    fps: SCAN_FPS,
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
    fps: SCAN_FPS,
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
                videoStabilizationMode="off"
                photoHdr={false}
                videoHdr={false}
                {...(currentScannerType ? qrCameraProps : barcodeCameraProps)}
                // FIX: isActive controls the native session — never rely on
                // unmounting the Camera to "stop" it. Declared AFTER the
                // scanner prop spread so these can never be overridden by it.
                isActive={!!visible && !pendingRestart}
                // Fade the black overlay out exactly when the preview shows its
                // first real frame — no blind timer, no flash of a stale frame.
                onPreviewStarted={handlePreviewStarted}
                onError={handleCameraError}
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
