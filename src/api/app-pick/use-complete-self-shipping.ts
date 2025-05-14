import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode?: string;
  proofDeliveryImages?: string[];
};

type Response = { error: string } & {};

const completeSelfShipping = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/completeSelfShipping', params);
};

export const useCompleteSelfShipping = (cb: () => void  ) => {
  return useMutation({
    mutationFn: (params: Variables) => completeSelfShipping(params),
    onSuccess: (response: Response) => {
      if (!response.error) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        showMessage({
          message: 'Hoàn tất giao hàng thành công',
          type: 'success',
        });
        cb?.();
      }
    },
  });
};
