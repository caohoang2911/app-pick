import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  orderCode: string;
  bagCode: string;
};

type Response = { error: string } & {};

const setOrderBagLabelScanned = async (
  params: Variables,
): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderBagLabelScanned', params);
};

export const useSetOrderScannedBagLabelScanned = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderBagLabelScanned(params),
    onSuccess: (response: Response, variables: Variables) => {
      if (!response.error) {
        queryClient.invalidateQueries({
          queryKey: ['orderDetail', variables.orderCode],
        });
      }
    },
  });
};
