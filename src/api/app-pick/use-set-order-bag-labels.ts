import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';
import { OrderDetailQueryData } from '~/src/core/utils/order-detail-query-cache';
import { OrderBagItem } from '~/src/types/order-bags';

type Variables = {
  data: OrderBagItem[];
  orderCode: string;
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const setOrderBagLabels = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderBagLabels', params);
};

export const useSetOrderBagLabels = (cb?: (error?: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderBagLabels(params),
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
