import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

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
  });
};
