import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { UserInfo } from '~/src/core/store/auth/utils';

const authorizeUserPassword = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('auth/authorizeUserPassword', params);
};

type Variables = { username: string; password: string };

type Response = { error: string } & { data: UserInfo }

export const useAuthorizeUserPassword = (cb?: (data: Response) => void) => useMutation({
  mutationFn: (params: Variables) => authorizeUserPassword(params),
  onSuccess: (data: Response) => {
    cb?.(data);
  },
});
