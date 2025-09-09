import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { hideAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & {};

const assignOrderToMe = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick-driver/assignOrderShippingToMe', params);
};

export const useDriverAssignOrderToMe = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => assignOrderToMe(params),
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