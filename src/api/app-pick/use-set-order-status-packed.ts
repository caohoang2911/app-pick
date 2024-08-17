import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

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
  });
};
