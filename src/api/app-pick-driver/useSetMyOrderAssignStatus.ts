import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  status: "ENABLE" | "DISABLE";
};

type Response = { error: string } & {};

const setMyOrderAssignStatus = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick-driver/setMyOrderAssignStatus', params);
};

export const useSetMyOrderAssignStatus = (cb?: () => void, cbError?: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setMyOrderAssignStatus(params),
    onSuccess: (data: Response) => {
      if(!data.error) {
        cb?.();
      } else {
        cbError?.(data.error);
      }
    },
   
  });
};