import { useCallback, useEffect } from 'react';
import { openOtaUpdateReadyModal } from '@/core/store/ota-update-modal';
import { useCodepushStore } from '@/core/store/codepush';

let fetchUpdateInFlight: Promise<void> | null = null;
let Updates: any = null;

try {
  // OTA mismatch can make expo-updates native module unavailable at runtime.
  Updates = require('expo-updates');
} catch (error) {
  console.warn(
    '[useCodepush] expo-updates unavailable, skipping OTA checks',
    error,
  );
}

export const useCodepush = () => {
  const isDoneCodepush = useCodepushStore((s) => s.isDoneCodepush);
  const setIsDoneCodepush = useCodepushStore((s) => s.setIsDoneCodepush);

  const allowUpdateByBuildNumber = () => true;

  const onFetchUpdateAsync = useCallback(async () => {
    if (!Updates?.checkForUpdateAsync || !Updates?.fetchUpdateAsync) {
      setIsDoneCodepush(true);
      return;
    }

    if (fetchUpdateInFlight) {
      await fetchUpdateInFlight;
      return;
    }

    fetchUpdateInFlight = (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && allowUpdateByBuildNumber()) {
          try {
            await Updates.fetchUpdateAsync();
            // Có OTA → bắt user reload. Chưa đánh dấu done để GitHub APK modal
            // chỉ chạy sau khi app đã apply CodePush (lần mở lại, không còn update).
            openOtaUpdateReadyModal();
          } catch {
            setIsDoneCodepush(true);
          }
        } else {
          setIsDoneCodepush(true);
        }
      } catch {
        setIsDoneCodepush(true);
      } finally {
        fetchUpdateInFlight = null;
      }
    })();

    await fetchUpdateInFlight;
  }, [setIsDoneCodepush]);

  useEffect(() => {
    void onFetchUpdateAsync();
  }, [onFetchUpdateAsync]);

  return {
    onFetchUpdateAsync,
    isDoneCodepush,
  };
};
