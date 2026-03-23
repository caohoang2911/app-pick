import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

export const useCodepush = () => {
  const [isDoneCodepush, setIsDoneCodepush] = useState(false);

  const allowUpdateByBuildNumber = () => true;

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable && allowUpdateByBuildNumber()) {
        try {
          await Updates.fetchUpdateAsync();
          if (Platform.OS === 'ios') {
            await Updates.reloadAsync();
          } else if (AppState.currentState === 'active') {
            // Android: small delay before reload to reduce startup-race crashes.
            await new Promise((resolve) => setTimeout(resolve, 1200));
            await Updates.reloadAsync();
          }
          setIsDoneCodepush(true);
        } catch (error) {
          setIsDoneCodepush(true);
        }
      } else {
        setIsDoneCodepush(true);
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      setIsDoneCodepush(true);
      // alert(`Error fetching latest update: ${error}`);
    }
  }

  useEffect(() => {
    onFetchUpdateAsync();
  }, []);

  return {
    onFetchUpdateAsync,
    isDoneCodepush,
  };
};
