import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { OrderItem } from '~/src/types/product';

type Variables = {
  pickedItem?: OrderItem;
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderItemPicked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderItemPicked', params);
};

export const useSetOrderItemPicked = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderItemPicked(params),
    onSuccess: (data: Response) => {
      if(!data.error) {
        cb?.();
      } else {
        cbError?.(data.error);
      }
    },
   
  });
};