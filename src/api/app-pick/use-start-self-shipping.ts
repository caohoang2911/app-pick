import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {};

const startSelfShipping = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/startSelfShipping', params);
};

export const useStartSelfShipping = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => startSelfShipping(params),
    onSuccess: (response: Response) => {
      if (!response.error) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        showMessage({
          message: 'Bắt đầu giao hàng thành công',
          type: 'success',
        });
        cb?.();
      }
    },
  });
};
