import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  employeeCode: string;
};

type Response = { error: string } & {
  data: unknown;
};

const removeEmployeeFromStore = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post('app-pick/removeEmployeeFromStore', params);
};

/** SM/TC gỡ một nhân viên khỏi siêu thị hiện tại. */
export const useRemoveEmployeeFromStore = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => removeEmployeeFromStore(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({
          message: 'Đã xoá nhân viên khỏi siêu thị',
          type: 'success',
        });
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
