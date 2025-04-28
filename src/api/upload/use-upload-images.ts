import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  imageBase64s?: string[]
};

type Response = { error: string } & {
  data: string[]
};

const uploadImages = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('upload/uploadImages', params);
};

export const useUploadImages = (cb: (data: string[]) => void, onError: (error: string) => void) => {
  return useMutation({
    mutationFn: (params: Variables) => uploadImages(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        cb?.(data.data);
      } else {
        onError?.(data.error);
        showMessage({
          message: data.error,
          type: 'danger',
        });
      }
      setLoading(false);
    },
  });
};
