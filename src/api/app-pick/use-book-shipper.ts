import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

export enum BookShipperProvider {
  AHAMOVE_ONWHEEL = 'AHAMOVE_ONWHEEL',
  AHAMOVE_DRIVER = 'AHAMOVE_DRIVER',
  GRAB_EXPRESS_DRIVER = 'GRAB_EXPRESS_DRIVER',
}

export type BookShipperExtraRequest = {
  packageSize?: string;
};

export type BookShipperVariables = {
  orderCode: string;
  serviceType: BookShipperProvider;
  extraRequest?: BookShipperExtraRequest;
};

type Response = { error: string };

const bookShipper = async (params: BookShipperVariables): Promise<Response> => {
  return await axiosClient.post('app-pick/bookShipper', params);
};

export const useBookShipper = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: BookShipperVariables) => bookShipper(params),
    onSuccess: (data: Response) => {
      cb?.();
      if (!data.error) {
        showMessage({
          message: 'Book shipper thành công',
          type: 'success',
        });
      }
      setLoading(false);
    },
  });
};
