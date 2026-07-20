import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { Product } from '~/src/types/product';

export type SetOrderItemPickedProduct = Product & {
  isPickedByManualBarcodeInput?: boolean;
  pickedImage?: string;
};

export type SetOrderItemPickedVariables = {
  pickedItem?: SetOrderItemPickedProduct;
  orderCode?: string;
};

type Variables = SetOrderItemPickedVariables;

type Response = { error: string } & {};

const setOrderItemPicked = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setOrderItemPicked', params);
};

export const useSetOrderItemPicked = (
  cb?: (variables: Variables) => void,
  cbError?: (error: string) => void,
) => {
  return useMutation({
    mutationFn: (params: Variables) => setOrderItemPicked(params),
    onSuccess: (data: Response, variables: Variables) => {
      if (!data.error) {
        cb?.(variables);
      } else {
        cbError?.(data.error);
      }
    },
  });
};
