import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { Product } from '~/src/types/product';

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderStatusPacked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderStatusPacked', params);
};

export const useSetOrderStatusPacked = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderStatusPacked(params),
    onSuccess: (response: Response) => {
      if (!response.error) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        showMessage({
        message: 'Đã đóng gói thành công',
        type: 'success',
        });
      }
    },
  });
};
