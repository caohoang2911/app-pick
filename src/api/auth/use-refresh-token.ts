import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';

type Response = { error: string } & { data: {} };

const refreshToken = async (): Promise<Response> => {
  return await axiosClient.post('auth/refreshToken');
};

export const useRefreshToken = (cb?: (data: any) => void) => {
  return useMutation({
    mutationKey: ['refreshToken'],
    mutationFn: () => refreshToken(),
    onSuccess: (data) => {
      if (!data.error) {
        cb?.(data);
      } else {
        setLoading(false);
      }
    },
  });
};

