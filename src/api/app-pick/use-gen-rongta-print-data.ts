import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  base64Images: Array<string>;
};

type Response = { error: string } & {
  data: Array<Array<number>>;
};

const genRongtaPrintData = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/genRongtaPrintData', params);
};

export const useGenRongtaPrintData = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => genRongtaPrintData(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        // showMessage({
        //   message: 'In thành công',
        //   type: 'success',
        // });
        cb?.();
      }
      setLoading(false);
    },
  });
};