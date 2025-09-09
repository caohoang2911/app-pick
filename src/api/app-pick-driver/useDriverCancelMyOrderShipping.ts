import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & {};

const cancelMyOrderShipping = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick-driver/cancelMyOrderShipping', params);
};

export const useDriverCancelMyOrderShipping = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => cancelMyOrderShipping(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if(!data.error) {
        cb?.();
      } else {
        cbError?.(data.error);
      }
    },
  });
};