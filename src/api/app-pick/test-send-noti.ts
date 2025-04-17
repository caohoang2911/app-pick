import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';

type Response = { error: string } & {};

const testSendNoti = async (): Promise<Response> => {
  return await axiosClient.post('app-pick/testSendNoti');
};

export const useTestSendNoti = () => {
  return useMutation({
    mutationFn: () => testSendNoti(),
    onSuccess: (response: Response) => {
      if (!response.error) {
        showMessage({
        message: 'Đã gửi thông báo thành công',
        type: 'success',
        });
      } else {
        showMessage({
          message: 'Gửi thông báo thất bại',
        });
      }
    },
  });
};
