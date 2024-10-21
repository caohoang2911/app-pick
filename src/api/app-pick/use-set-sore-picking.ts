import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  storeCode?: number | string;
};

type Response = { error: string } & {};

const setStorePicking = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setStorePicking', params);
};

export const useSetStorePicking = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setStorePicking(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        cb?.();
      }
      setLoading(false);
    },
  });
};