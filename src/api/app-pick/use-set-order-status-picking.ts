import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderStatusPicking = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderStatusPicking', params);
};

export const useSetOrderStatusPicking = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderStatusPicking(params),
    onSuccess: (response: Response) => {
      if (!response.error) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        showMessage({
          message: 'Xác nhận thành công',
          type: 'success',
        });
      }
    },
  });
};
