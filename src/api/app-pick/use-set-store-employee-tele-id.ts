import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  employeeCode: string;
  teleId: string;
};

type Response = { error: string } & {
  data: unknown;
};

const setStoreEmployeeTeleId = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setStoreEmployeeTeleId', params);
};

/** SM/TC cập nhật Telegram ID cho một nhân viên trong siêu thị. */
export const useSetStoreEmployeeTeleId = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setStoreEmployeeTeleId(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({ message: 'Đã cập nhật Telegram ID', type: 'success' });
        cb?.();
      } else {
        showMessage({ message: data.error, type: 'danger' });
      }
    },
    // Tránh kẹt overlay loading khi request lỗi (offline/timeout/5xx).
    onError: () => {
      setLoading(false);
    },
  });
};
