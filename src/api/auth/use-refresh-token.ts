import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { removeItem, setItem } from '~/src/core/storage';
import { setUser, useAuth } from '~/src/core/store/auth';
import { setToken, setUserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';

type Response = { error: string } & { data: {} };

const refreshToken = async (): Promise<Response> => {
  return await axiosClient.post('auth/refreshToken');
};

export const useRefreshToken = (cb?: (data: any) => void) => {
  const userInfo = useAuth.use.userInfo();

  return useMutation({
    mutationKey: ['refreshToken'],
    mutationFn: () => refreshToken(),
    onSuccess: (data: any & { data: { zas: string } }) => {
      setLoading(true);
      setToken(data?.data?.zas || '');

      setUserInfo({
        ...userInfo,
        ...data?.data,
      });

      setUser({
        ...userInfo,
        ...data?.data,
      });
      setLoading(false);
      cb?.(data);

      setLoading(false);
    },
  });
};
