import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { Product } from '~/src/types/product';

type Variables = {
  pickedItems?: Product[];
  orderCode?: string;
};

type Response = { error: string } & {};

const saveOrderPickingAsDraft = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/saveOrderPickingAsDraft', params);
};

export const useSaveOrderPickingAsDraft = () => {
  return useMutation({
    mutationFn: (params: Variables) => saveOrderPickingAsDraft(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Lưu tạm thành công',
          type: 'success',
        });
      }
      setLoading(false);
    },
  });
};