import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

export const useCodepush = () => {
  const [isDoneCodepush, setIsDoneCodepush] = useState(false);
  const currentVersion = Constants.expoConfig?.version;
  const buildNumber = Constants.expoConfig?.ios?.buildNumber;

  const allowUpdateByBuildNumber = () => {
    if (Platform.OS === 'ios') {
      // return Number(buildNumber) >= 69 && currentVersion === "1.0.16";
      return true;
    }
    return true;
  }

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable && allowUpdateByBuildNumber()) {
        Alert.alert(
          'Đã có bản cập nhật mới',
          'Bạn có muốn cập nhật không?',
          [
            {
              text: 'Lần sau',
              style: 'cancel',
              onPress: () => {
                setIsDoneCodepush(true);
              },
            },
            {
              text: 'Cập nhật',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                  setIsDoneCodepush(true);
                } catch (error) {
                  setIsDoneCodepush(true);
                  // alert(`Error fetching latest update: ${error}`);
                }
              },
            },
          ],
          { cancelable: false }
        );
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
    isDoneCodepush
  }
}