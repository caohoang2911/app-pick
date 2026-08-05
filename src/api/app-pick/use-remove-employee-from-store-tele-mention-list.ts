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

const removeEmployeeFromStoreTeleMentionList = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post(
    'app-pick/removeEmployeeFromStoreTeleMentionList',
    params,
  );
};

/** SM/TC gỡ nhân viên khỏi danh sách nhận mention của nhóm Tele siêu thị. */
export const useRemoveEmployeeFromStoreTeleMentionList = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) =>
      removeEmployeeFromStoreTeleMentionList(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({
          message: 'Đã xoá nhân viên khỏi nhóm nhận thông báo Tele',
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
