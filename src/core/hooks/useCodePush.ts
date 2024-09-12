import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { hideAlert, showAlert } from '../store/alert-dialog';

export const useCodepush = () => {
  const [isDoneCodepush, setIsDoneCodepush] = useState(false);

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        showAlert({
          title: 'Đã có bản cập nhật mới',
          message: 'Bạn có muốn cập nhật không?',
          confirmText: 'Cập nhật',
          cancelText: 'Lần sau',
          onConfirm: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
              setIsDoneCodepush(true);
            } catch (error) {
              setIsDoneCodepush(true);
              // alert(`Error fetching latest update: ${error}`);
            }
            hideAlert();
          },
          onCancel: () => {
            setIsDoneCodepush(true);
            hideAlert();
          }
        });
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