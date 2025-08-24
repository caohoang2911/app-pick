import { axiosClient } from '@/api/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';
import { showMessage } from 'react-native-flash-message';
import { router } from 'expo-router';

type Variables = {
  orderCode: string;
  replacedItemId: number;
  pickedItemId: number;
};

type Response = { error: string } & {
  data: string;
};


const replacePickedItem = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/replacePickedItem', params);
};

export const useReplacePickedItem = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Variables) => replacePickedItem(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        onSuccess?.();
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
        showMessage({
          message: 'Thay thế sản phẩm thành công',
          type: 'success',
        });
      } else {
        showMessage({
          message: data.error,
          type: 'danger',
        });
      }
    },
  });
};