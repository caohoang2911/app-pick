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

const addEmployeeToStoreTeleMentionList = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post(
    'app-pick/addEmployeeToStoreTeleMentionList',
    params,
  );
};

/** SM/TC thêm nhân viên vào danh sách nhận mention của nhóm Tele siêu thị. */
export const useAddEmployeeToStoreTeleMentionList = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) =>
      addEmployeeToStoreTeleMentionList(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({
          message: 'Đã thêm nhân viên vào nhóm nhận thông báo Tele',
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
