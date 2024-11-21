import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  data: {
    noti: {
      isSubcribeOrderStoreDelivery: boolean;
      isSubcribeOrderCustomerPickup: boolean;
      isSubcribeOrderShipperDelivery: boolean;
    };
  };
};

type Response = { error: string } & {
  data: 'SUCCESS';
};

const updateSetting = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/updateSetting', params);
};

export const useUpdateSetting = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => updateSetting(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        showMessage({
          message: 'Lưu cài đặt thành công',
          type: 'success',
        });
        cb?.();
      }
      setLoading(false);
    },
  });
};