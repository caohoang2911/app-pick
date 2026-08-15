import { useCallback } from 'react';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { useAuth } from '~/src/core';
import { useStartMyKposShift } from '~/src/api/app-pick/use-start-my-kpos-shift';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '../store/loading';
import { useGetMyProfile } from '~/src/api/employee/use-get-my-profile';

/**
 * Hook để kiểm tra shift status khi vào app
 * Nếu chưa vào ca, hiển thị popup bắt buộc vào ca (không cho đóng)
 */
export const useCheckShift = (successCallback: () => void) => {
  const userInfo = useAuth.use.userInfo();
  const authStatus = useAuth.use.status();
  const kposShiftStatus = userInfo?.kposShiftStatus;

  const { mutateAsync: refreshToken } = useRefreshToken();
  const { refetch: refetchGetMyProfile } = useGetMyProfile();

  const { mutate: startMyKposShift, isPending: isLoadingStartMyKposShift } =
    useStartMyKposShift(async () => {
      // Sau khi vào ca thành công, refresh token để cập nhật userInfo
      setLoading(false);
      showMessage({
        message: 'Vào ca thành công',
        type: 'success',
      });
      await refreshToken();
      await refetchGetMyProfile();
      successCallback?.();
    });

  const checkShift = useCallback(() => {
    // Chỉ check khi đã sign in và có userInfo và profile đã được load
    if (authStatus !== 'signIn' || !userInfo?.storeCode) {
      return;
    }
    // Chỉ check một lần

    // Nếu đã vào ca, không cần làm gì
    if (kposShiftStatus === 'ON_SHIFT') {
      successCallback?.();
      return;
    }

    // Nếu chưa vào ca (OFF_SHIFF hoặc undefined), hiển thị popup bắt buộc (không cho đóng)
    showAlert({
      title: 'Xác nhận vào ca',
      message: 'Bạn chưa vào ca. Vui lòng vào ca để tiếp tục sử dụng ứng dụng.',
      onConfirm: () => {
        hideAlert();
        setLoading(true);
        startMyKposShift({});
      },
      loading: isLoadingStartMyKposShift,
      confirmText: 'Vào ca ngay',
    });
  }, [
    authStatus,
    userInfo,
    kposShiftStatus,
    startMyKposShift,
    isLoadingStartMyKposShift,
    successCallback,
  ]);

  return { checkShift };
};
