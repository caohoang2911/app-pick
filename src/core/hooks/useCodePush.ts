import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useCodepush = () => {
  const [isDoneCodepush, setIsDoneCodepush] = useState(false);

  const allowUpdateByBuildNumber = () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    return true;
  }

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable && allowUpdateByBuildNumber()) {
        try {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          setIsDoneCodepush(true);
        } catch (error) {
          setIsDoneCodepush(true);
        }
      }
      else {
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
    isDoneCodepush
  }
}