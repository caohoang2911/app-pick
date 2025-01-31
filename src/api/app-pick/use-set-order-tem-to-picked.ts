import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { Product } from '~/src/types/product';

type Variables = {
  pickedItem?: Product;
  orderCode?: string;
};

type Response = { error: string } & {};

const setOrderItemToPicked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderItemToPicked', params);
};

export const useSetOrderTemToPicked = () => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderItemToPicked(params),
  });
};