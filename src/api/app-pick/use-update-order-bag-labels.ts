import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { OrderBagItem } from '~/src/types/order-bag';

type Variables = {
  data: OrderBagItem[],
  orderCode: string,
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const updateOrderBagLabels = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/updateOrderBagLabels', params);
};

export const useUpdateOrderBagLabels = (cb?: (error?: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => updateOrderBagLabels(params),
    onSuccess: (data: Response) => {
      cb?.(data?.error);
      setLoading(false);
    },
  });
};