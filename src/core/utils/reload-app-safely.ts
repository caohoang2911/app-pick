/**
 * Soft-restart JS runtime (expo-updates reloadAsync) an toàn với vision-camera:
 * set pendingRestart trước → ScannerBox bỏ FrameProcessor → đợi 700ms → reload.
 */
import { useOtaUpdateReadyModal } from '@/core/store/ota-update-modal';

let Updates: { reloadAsync?: () => Promise<void> } | null = null;
try {
  Updates = require('expo-updates');
} catch {
  Updates = null;
}

let reloadInFlight = false;

export async function reloadAppSafely(reason?: string): Promise<void> {
  if (reloadInFlight) return;
  reloadInFlight = true;
  if (reason) {
    console.log('[reloadAppSafely]', reason);
  }

  useOtaUpdateReadyModal.getState().setPendingRestart(true);
  // LOAD-BEARING: khớp OtaUpdateReadyModal — đợi camera nhả FrameProcessor.
  await new Promise((r) => setTimeout(r, 700));

  try {
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
    console.warn('[reloadAppSafely] expo-updates.reloadAsync unavailable');
  } catch (e) {
    console.warn('[reloadAppSafely] failed', e);
  } finally {
    reloadInFlight = false;
    useOtaUpdateReadyModal.getState().setPendingRestart(false);
  }
}
