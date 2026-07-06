import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  // Token lấy từ mã QR "Chuyển Siêu Thị" mà nhân viên sinh ra.
  token: string;
};

type Response = { error: string } & {
  data: unknown;
};

const acceptTokenAssignEmployeeToStore = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post(
    'app-pick/acceptTokenAssignEmployeeToStore',
    params,
  );
};

/** SM/TC quét QR nhân viên → duyệt thêm nhân viên vào siêu thị hiện tại. */
export const useAcceptTokenAssignEmployeeToStore = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => acceptTokenAssignEmployeeToStore(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({
          message: 'Thêm nhân viên vào siêu thị thành công',
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
