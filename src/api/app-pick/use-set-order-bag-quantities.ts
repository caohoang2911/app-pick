import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';
import { OrderDetailQueryData } from '~/src/core/utils/order-detail-query-cache';

type Variables = {
  orderCode: string;
  bagQuantities: Record<string, number>;
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const setOrderBagQuantities = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderBagQuantities', params);
};

export const useSetOrderBagQuantities = (cb?: (error?: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderBagQuantities(params),
    onSuccess: (data: Response, variables: Variables) => {
      if (data?.error) {
        cb?.(data.error);
      } else {
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
                  bagQuantities: variables.bagQuantities,
                },
              },
            };
          },
        );
        cb?.();
      }
      setLoading(false);
    },
  });
};
