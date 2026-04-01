import * as Updates from 'expo-updates';
import { useCallback, useEffect } from 'react';
import { openOtaUpdateReadyModal } from '@/core/store/ota-update-modal';
import { useCodepushStore } from '@/core/store/codepush';

let fetchUpdateInFlight: Promise<void> | null = null;

export const useCodepush = () => {
  const isDoneCodepush = useCodepushStore((s) => s.isDoneCodepush);
  const setIsDoneCodepush = useCodepushStore((s) => s.setIsDoneCodepush);

  const allowUpdateByBuildNumber = () => true;

  const onFetchUpdateAsync = useCallback(async () => {
    if (fetchUpdateInFlight) {
      return fetchUpdateInFlight;
    }

    fetchUpdateInFlight = (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && allowUpdateByBuildNumber()) {
          try {
            await Updates.fetchUpdateAsync();
            setIsDoneCodepush(true);
            requestAnimationFrame(() => openOtaUpdateReadyModal());
          } catch {
            setIsDoneCodepush(true);
          }
        } else {
          setIsDoneCodepush(true);
        }
      } catch {
        setIsDoneCodepush(true);
      }
    })();

    try {
      await fetchUpdateInFlight;
    } finally {
      fetchUpdateInFlight = null;
    }
  }, [setIsDoneCodepush]);

  useEffect(() => {
    void onFetchUpdateAsync();
  }, [onFetchUpdateAsync]);

  return {
    onFetchUpdateAsync,
    isDoneCodepush,
  };
};
