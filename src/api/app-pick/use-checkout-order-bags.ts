import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const checkoutOrderBags = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/checkoutOrderBags', params);
};

export const useCheckoutOrderBags = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => checkoutOrderBags(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Hoàn tất scan túi hàng',
          type: 'success',
        });
        cb?.();
      } else {
        showMessage({
          message: data.error,
          type: 'danger',
        });
      }
      setLoading(false);
    },
  });
};