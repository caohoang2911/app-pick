import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Response = { error: string } & { data: {} };

const logout = async (): Promise<Response> => {
  return await axiosClient.post('auth/logout');
};

export const useLogout = () => {
  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => logout(),
  });
};
