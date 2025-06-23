import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode: string;
  cancelReason: string;
};

type Response = { error: string } & AxiosResponse;

const cancelAhamoveShipper = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/cancelAhamoveShipper', params);
};

export const useCancelAhamoveShipper = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => cancelAhamoveShipper(params),
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