import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { OrderBagItem } from '~/src/types/order-bag';
import { OrderDetail } from '~/src/types/order-pick';

type Variables = {
  data: OrderBagItem[];
  orderCode: string;
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

type OrderDetailQueryData = { data?: OrderDetail; error?: string };

const updateOrderBagLabels = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/updateOrderBagLabels', params);
};

export const useUpdateOrderBagLabels = (cb?: (error?: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => updateOrderBagLabels(params),
    onSuccess: (data: Response, variables: Variables) => {
      if (data?.error) {
        cb?.(data.error);
      } else {
        // Cập nhật cache trực tiếp — tránh refetch làm list tem nhảy / chờ server.
        queryClient.setQueryData<OrderDetailQueryData>(
          ['orderDetail', variables.orderCode],
          (old) => {
            if (!old?.data?.header) return old;
            return {
              ...old,
              data: {
                ...old.data,
                header: {
                  ...old.data.header,
                  bagLabels: variables.data,
                },
              },
            };
          },
        );
        cb?.(); // No error, success case
      }
      setLoading(false);
    },
  });
};
