import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  orderCode: string;
  labelCodes: Array<string>;
};

type Response = { error: string } & {};

const setOrderPrintedBagLabel = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderPrintedBagLabel', params);
};

export const useSetOrderPrintedBagLabel = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderPrintedBagLabel(params),
    onSuccess: (response: Response) => {
      if(!response.error) {
        cb?.()
      }
    },
  });
};
