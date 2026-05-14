import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setUser, useAuth } from '~/src/core/store/auth';
import { setToken, setUserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';
import { getApVersion } from '~/src/core/utils/app-version';

type Response = { error: string } & { data: {} };

const refreshToken = async (): Promise<Response> => {
  return await axiosClient.post('auth/refreshToken', {
    apVersion: getApVersion(),
  });
};

export const useRefreshToken = (cb?: (data: any) => void) => {
  const userInfo = useAuth.use.userInfo();

  return useMutation({
    mutationKey: ['refreshToken'],
    mutationFn: () => refreshToken(),
    onSuccess: (data: any & { data: { zas: string } }) => {
      if (data?.error || !data?.data?.zas) {
        return;
      }

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
    },
  });
};
