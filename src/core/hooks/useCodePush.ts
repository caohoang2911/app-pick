import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { openOtaUpdateReadyModal } from '@/core/store/ota-update-modal';

export const useCodepush = () => {
  const [isDoneCodepush, setIsDoneCodepush] = useState(false);

  const allowUpdateByBuildNumber = () => true;

  const onFetchUpdateAsync = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void onFetchUpdateAsync();
  }, [onFetchUpdateAsync]);

  return {
    onFetchUpdateAsync,
    isDoneCodepush,
  };
};
