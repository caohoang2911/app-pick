import { useEffect, useRef } from 'react';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { useAuth } from '~/src/core';
import { useStartMyKposShift } from '~/src/api/app-pick/use-start-my-kpos-shift';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { showMessage } from 'react-native-flash-message';

/**
 * Hook để kiểm tra shift status khi vào app
 * Nếu chưa vào ca, hiển thị popup bắt buộc vào ca (không cho đóng)
 */
export const useCheckShiftOnAppStart = () => {
  const userInfo = useAuth.use.userInfo();
  const authStatus = useAuth.use.status();
  const kposShiftStatus = userInfo?.kposShiftStatus;
  const hasCheckedRef = useRef(false);

  const { mutate: refreshToken } = useRefreshToken();

  const { mutate: startMyKposShift, isPending: isLoadingStartMyKposShift } =
    useStartMyKposShift(() => {
      // Sau khi vào ca thành công, refresh token để cập nhật userInfo
      showMessage({
        message: 'Vào ca thành công',
        type: 'success',
      });
      hideAlert();
      refreshToken();
    });

  useEffect(() => {
    // Chỉ check khi đã sign in và có userInfo và profile đã được load
    if (authStatus !== 'signIn' || !userInfo?.storeCode) {
      return;
    }

    // Chỉ check một lần
    if (hasCheckedRef.current) {
      return;
    }

    // Nếu đã vào ca, không cần làm gì
    if (kposShiftStatus === 'ON_SHIFT') {
      hasCheckedRef.current = true;
      return;
    }

    // Nếu chưa vào ca (OFF_SHIFF hoặc undefined), hiển thị popup bắt buộc (không cho đóng)
    hasCheckedRef.current = true;
    showAlert({
      title: 'Xác nhận vào ca',
      message: 'Bạn chưa vào ca. Vui lòng vào ca để tiếp tục sử dụng ứng dụng.',
      onConfirm: () => {
        startMyKposShift({});
      },
      loading: isLoadingStartMyKposShift,
      confirmText: 'Vào ca ngay',
      isHideCancelButton: true, // Không cho đóng, chỉ có nút xác nhận
    });
  }, [
    authStatus,
    userInfo,
    kposShiftStatus,
    startMyKposShift,
    isLoadingStartMyKposShift,
  ]);
};
