import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { UserInfo } from '~/src/core/store/auth/utils';
import { useSetAppVersionWithAutoInfo } from '../app-pick/use-set-app-version';

const authorizeUserPassword = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('auth/authorizeUserPassword', params);
};

type Variables = { username: string; password: string };

type Response = { error: string } & { data: UserInfo }

export const useAuthorizeUserPassword = (cb?: (data: Response) => void) => {
  const { setVersionWithAutoInfo } = useSetAppVersionWithAutoInfo();
  return useMutation({
  mutationFn: (params: Variables) => authorizeUserPassword(params),
  onSuccess: (data: Response) => {
    if(!data.error) {
      setVersionWithAutoInfo();
    }
    cb?.(data);
  },
});
};
