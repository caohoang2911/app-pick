import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & AxiosResponse;

const completeOrder = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/completeOrder', params);
};

export const useCompleteOrder = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => completeOrder(params),
    onSuccess: (data: Response) => {
      cb?.();
      if (!data.error) {
        showMessage({
          message: 'Store tự giao hàng thành công',
          type: 'success',
        });
      }
    },
  });
};