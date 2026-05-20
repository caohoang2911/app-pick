import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';

type Variables = {
  orderCode: string;
  proofImages?: string[];
};

type Response = { error: string } & AxiosResponse;

const handoverOrder = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/handoverOrder', params);
};

export const useHandoverOrder = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => handoverOrder(params),
    onSuccess: (data: Response, variables: Variables) => {
      if (!data.error) {
        queryClient.invalidateQueries({
          queryKey: ['orderDetail', variables.orderCode],
        });
        cb?.();
      }
    },
  });
};
