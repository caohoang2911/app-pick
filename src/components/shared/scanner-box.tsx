import {
  Barcode,
  BarcodeType,
  useBarcodeScanner,
} from '@mgcrea/vision-camera-barcode-scanner';
import { Portal } from '@gorhom/portal';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
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
import useCamera from '~/src/core/hooks/useCamera';
import { useOtaUpdateReadyModal } from '~/src/core/store/ota-update-modal';
import ScannerLayout from './scanner-box-layout';
import {
  BARCODE_SCAN_REGION,
  BARCODE_VISION_REGION,
  QR_SCAN_REGION,
  QR_VISION_REGION,
} from './scanner-region';

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

// ── Self-heal watchdog tuning ───────────────────────────────────────────────
// If the preview hasn't produced its FIRST real frame within WATCHDOG_MS we
// treat the session as stuck (silent interruption / device contention that
// vision-camera 4.x neither observes nor auto-resumes) and force a restart —
// instead of the old behaviour of blindly revealing the frozen screen behind.
const WATCHDOG_MS = 1500;
// A restart drives isActive off→on as TWO separate commits. They MUST land as
// distinct configure() calls or vision-camera's currentConfigureCall guard +
// checkIsActive early-return collapse them into a no-op. This gap guarantees it.
const RESTART_GAP_MS = 90;
// Bounded so a device still held by a live interruption can't loop forever.
const MAX_RECOVERY_ATTEMPTS = 3;

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
//
// Only the FOCUSED + visible instance activates its session, so at most one
// AVCaptureSession ever runs on the physical 'back' camera even though every
// screen keeps its own <ScannerBox> permanently mounted. A watchdog force-
// restarts (isActive off→on) any session whose preview never starts, and never
// reveals the frozen backdrop on failure.
// ─────────────────────────────────────────────────────────────────────────────
const ScannerBox = ({
  visible,
  onDestroy,
  onSuccessBarcodeScanned,
  isQRScanner = true,
}: Props) => {
  const { permission, requestPermission } = useCamera();
  const isFocused = useIsFocused();
  const pendingRestart = useOtaUpdateReadyModal((s) => s.pendingRestart);
  const [currentScannerType, setCurrentScannerType] = useState(isQRScanner);
  const [isCameraReady, setIsCameraReady] = useState(false);
  // Momentarily forces isActive=false to push the native session through a real
  // stopRunning()→startRunning() cycle. See forceRestart / recoveryRef.
  const [restarting, setRestarting] = useState(false);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const mountedRef = useRef(true);
  const closeRequestedRef = useRef(false);
  // Watchdog that force-restarts (never blindly reveals) if the preview never
  // delivers a first frame.
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer that flips `restarting` back to false to complete the off→on toggle.
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True once the live preview has delivered a real frame for the current open.
  const previewStartedRef = useRef(false);
  // Number of self-heal restarts attempted for the current open.
  const recoveryCountRef = useRef(0);
  // Ref-held so armWatchdog ↔ recovery don't form a hook-dependency cycle.
  // Assigned below, once forceRestart / armWatchdog exist.
  const recoveryRef = useRef<() => void>(() => {});
  // True once the app has been fully backgrounded — so the foreground re-kick
  // fires on a REAL background trip, not a transient 'inactive' (control centre,
  // notification shade), which would cause a needless black flash mid-scan.
  const wasBackgroundedRef = useRef(false);

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

  // Only the focused + visible instance owns the physical camera.
  const shouldShow = !!visible && isFocused;
  // isActive is additionally suppressed for one commit during a forced restart.
  const isActive = shouldShow && !pendingRestart && !restarting;

  // ── Self-heal helpers (stable) ─────────────────────────────────────────────
  // Drive isActive off→on across two separate commits so vision-camera runs a
  // real stopRunning()→startRunning(). This is the exact same lever the existing
  // pendingRestart mechanism uses — it never unmounts <Camera>, so it cannot
  // reintroduce the JSI/Worklet destructor crash.
  const forceRestart = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    setRestarting(true);
    restartTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setRestarting(false);
    }, RESTART_GAP_MS);
  }, []);

  const armWatchdog = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      recoveryRef.current();
    }, WATCHDOG_MS);
  }, []);

  // Assign the recovery routine now that forceRestart / armWatchdog exist.
  recoveryRef.current = () => {
    if (!mountedRef.current || previewStartedRef.current) return;
    if (recoveryCountRef.current >= MAX_RECOVERY_ATTEMPTS) {
      // Bounded: never silently fade onto a dead/frozen preview. Close the
      // scanner so the user gets a clean retry instead of the frozen backdrop.
      onDestroyRef.current?.();
      return;
    }
    recoveryCountRef.current += 1;
    forceRestart();
    armWatchdog();
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
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
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    scannedShared.value = false;
    closeRequestedRef.current = false;
    previewStartedRef.current = false;
    recoveryCountRef.current = 0;
    setRestarting(false);

    if (shouldShow && !pendingRestart) {
      // Start fully black. The overlay is faded out only once the preview
      // delivers its first real frame (onPreviewStarted) — no blind delay and
      // no flash of the previous, frozen frame. If that first frame never
      // arrives the watchdog force-restarts instead of revealing the backdrop.
      isActiveShared.value = true;
      setIsCameraReady(false);
      overlayOpacity.setValue(1);
      armWatchdog();
    } else {
      // Not the focused+visible owner (hidden via display:none) → fully inactive
      // so at most ONE session runs on the physical 'back' camera at a time.
      isActiveShared.value = false;
      setIsCameraReady(false);
      overlayOpacity.setValue(1);
    }
  }, [shouldShow, pendingRestart, armWatchdog]);

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

  // Returning to foreground while the scanner is open: vision-camera 4.x never
  // observes AVCaptureSession *video* interruption and won't re-configure
  // without a prop change, so a session interrupted by backgrounding or a
  // CallKit/Stringee call can stay frozen. Re-black and force a restart; the
  // watchdog backstops it.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasBackgroundedRef.current = true;
        return;
      }
      // Ignore 'inactive'; only act on a real background→active round trip.
      if (state !== 'active') return;
      if (!wasBackgroundedRef.current) return;
      wasBackgroundedRef.current = false;
      if (!shouldShow || pendingRestart) return;
      previewStartedRef.current = false;
      recoveryCountRef.current = 0;
      if (mountedRef.current) setIsCameraReady(false);
      overlayOpacity.setValue(1);
      forceRestart();
      armWatchdog();
    });
    return () => sub.remove();
  }, [shouldShow, pendingRestart, forceRestart, armWatchdog]);

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
    previewStartedRef.current = true;
    recoveryCountRef.current = 0;
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (mountedRef.current) setIsCameraReady(true);
  }, []);

  // A session error must NOT reveal the frozen preview — route it through the
  // same bounded self-heal as the watchdog.
  const handleCameraError = useCallback(() => {
    recoveryRef.current();
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
      {/* ── Permission denied UI (shown only when focused, visible & no permission) ── */}
      {shouldShow && permission && !permission.granted && (
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
            // FIX: display:'none' hides without triggering unmount/destructor.
            // Gated on shouldShow (visible && focused) so a blurred-but-visible
            // sibling never paints its opaque overlay nor runs a session.
            !shouldShow && styles.hidden,
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
                // Only the focused+visible owner activates, and a forced restart
                // briefly toggles it off→on to recover a stuck session.
                isActive={isActive}
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
