import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  itemId?: number,
  reason: string,
  orderCode: string
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const removeProductItem = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/removeProductItem', params);
};

export const useRemoveProductItem = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => removeProductItem(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Xoá sản phẩm thành công',
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