import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { OrderShippingCancelReason } from '~/src/core/constants/order';

type Variables = {
  orderCode: string;
  cancelReason: OrderShippingCancelReason | string;
  cancelDesc?: string;
};

type Response = { error: string } & AxiosResponse;

const cancelBookShipper = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/cancelBookShipper', params);
};

export const useCancelBookShipper = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => cancelBookShipper(params),
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
