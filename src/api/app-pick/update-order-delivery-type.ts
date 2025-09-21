import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  type: string;
  orderCode: string;
};

type Response = { error: string } & {};

const updateOrderDeliveryType = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/updateOrderDeliveryType', params);
};

export const useUpdateOrderDeliveryType = ({cbSuccess, cbError}: {cbSuccess?: () => void, cbError?: (error: string) => void}) => {
  return useMutation({
    mutationFn: (params: Variables) => updateOrderDeliveryType(params),
    onSuccess: (data: Response) => {
      if(!data.error) {
        cbSuccess?.();
      } else {
        cbError?.(data.error);
      }
    },
  });
};