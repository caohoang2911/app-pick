import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { hideAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  status : "ENABLE" | "DISABLE";
  orderCode: string;
};

type Response = { error: string } & {};

const setMyOrderAssignStatus = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick-driver/setMyOrderAssignStatus', params);
};

export const useDriverSetMyOrderAssignStatus = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setMyOrderAssignStatus(params),
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