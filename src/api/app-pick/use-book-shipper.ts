import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { Product } from '~/src/types/product';

type Variables = {
  orderCode: string;
  packageSize: string;
  serviceId: string;
  scheduleType: string;
};

type Response = { error: string };

const bookShipper = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/bookShipper', params);
};

export const useBookShipper = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => bookShipper(params),
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