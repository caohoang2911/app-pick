import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & {};

const setOrderScanedBagLabel = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderScanedBagLabel', params);
};

export const useSetOrderScanedBagLabel = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderScanedBagLabel(params),
    onSuccess: (response: Response) => {},
  });
};
