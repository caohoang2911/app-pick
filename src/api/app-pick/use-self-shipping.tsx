import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & AxiosResponse;

const selfShipping = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/selfShipping', params);
};

export const useSelfShipping = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => selfShipping(params),
    onSuccess: (data: Response) => {
      cb?.();
      if (!data.error) {
        showMessage({
          message: 'Cập nhật thành công',
          type: 'success',
        });
      }
    },
  });
};