import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderStatusPacked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderStatusPacked', params);
};

export const useSetOrderStatusPacked = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderStatusPacked(params),
    onSuccess: (response: Response) => {
      if (!response.error) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        cb?.();
      }
    },
  });
};
