import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode: string;
  reason: string;
};

type Response = { error: string } & AxiosResponse;

const validateDeliveryOrderFail = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/deliveryOrderFail', params);
};

export const useValidateDeliveryOrderFail = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => validateDeliveryOrderFail(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Đã ghi nhận giao hàng thất bại',
          type: 'success',
        });
        cb?.();
      }
    },
  });
};
