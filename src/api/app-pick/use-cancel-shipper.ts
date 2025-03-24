import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode: string;
  cancelReason: string;
};

type Response = { error: string } & AxiosResponse;

const cancelShipper = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/cancelBookShipper', params);
};

export const useCancelShipper = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => cancelShipper(params),
    onSuccess: (data: Response) => {
      cb?.();
      if (!data.error) {
        showMessage({
          message: 'Đã hoàn huỷ book shipper',
          type: 'success',
        });
      }
    },
  });
};