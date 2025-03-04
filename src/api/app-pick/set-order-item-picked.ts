import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { Product } from '~/src/types/product';

type Variables = {
  pickedItem?: Product;
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderItemPicked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderItemPicked', params);
};

export const useSetOrderItemPicked = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderItemPicked(params),
  });
};