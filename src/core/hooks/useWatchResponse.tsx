import { useEffect } from 'react';
import { axiosClient } from '~/src/api/shared';
import { hideAlert, showAlert } from '../store/alert-dialog';
import { useSignOut } from './useSignOut';

export const useWatchResponse = () => {
  const triggerSignOut = useSignOut();

  useEffect(() => {
    const resInterceptor = (response: any) => {
      if (response?.error === 'ERROR_EMPLOYEE_STORE_OUT_OF_DATE') {
        showAlert({
          title: 'Thông báo',
          message: 'Tài khoản đã bị thay đổi siêu thị. Vui lòng đăng nhập lại!',
          stackId: 'employee-store-out-of-date',
          onConfirm: () => {
            hideAlert();
            triggerSignOut();
          },
          isHideCancelButton: true,
        });
      }
      return response;
    };

    const errInterceptor = (error: any) => {
      return Promise.reject(error);
    };

    const interceptor = axiosClient.interceptors.response.use(
      resInterceptor,
      errInterceptor,
    );

    // cleanup khi unmount (rất quan trọng)
    return () => {
      axiosClient.interceptors.response.eject(interceptor);
    };
  }, []);

  return null;
};
