import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';
import { PackageSize } from '~/src/types/order';

type Variables = {
  size: PackageSize,
  orderCode: string
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const updateShippingPackageSize = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/updateShippingPackageSize', params);
};

export const useUpdateShippingPackageSize = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => updateShippingPackageSize(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Lưu gói hàng thành công',
          type: 'success',
        });
        cb?.();
      }
      setLoading(false);
    },
  });
};