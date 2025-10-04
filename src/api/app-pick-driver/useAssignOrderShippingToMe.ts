import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  status: "ENABLE" | "DISABLE";
  orderCode: string;
};

type Response = { error: string } & {};

const assignOrderShippingToMe = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick-driver/assignOrderShippingToMe', params);
};

export const useAssignOrderShippingToMe = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => assignOrderShippingToMe(params),
    onSuccess: (data: Response) => {
      if(!data.error) {
        cb?.();
      } else {
        cbError?.(data.error);
      }
      setLoading(false);
    },
   
  });
};