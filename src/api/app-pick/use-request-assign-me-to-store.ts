import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';
import { showMessage } from 'react-native-flash-message';
import { EmployeeRole } from '~/src/types/employee';

type Variables = {
  employeeCode: string;
  storeCode: string;
  role: EmployeeRole;
};

// `data` là token QR (chuỗi) để SM/TC quét → acceptTokenAssignEmployeeToStore(token).
type Response = { error: string } & {
  data: string;
};

const requestAssignMeToStore = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/requestAssignMeToStore', params);
};

/**
 * Gửi yêu cầu cấp quyền vào siêu thị kèm role đã chọn.
 * onSuccess truyền `token` (data) ra ngoài để caller tự quyết định điều hướng:
 * - role STORE/STORE_FULLTIME_PICKER → hiển thị mã QR cho SM/TC quét duyệt.
 * - role SM/TC → chờ Admin duyệt (không có QR).
 */
export const useRequestAssignMeToStore = (cb?: (token: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => requestAssignMeToStore(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        cb?.(data.data);
      } else {
        showMessage({
          message: data.error,
          type: 'danger',
        });
      }
    },
    // Đừng để overlay loading kẹt lại khi request lỗi (không có onError sẽ treo).
    onError: () => {
      setLoading(false);
    },
  });
};
