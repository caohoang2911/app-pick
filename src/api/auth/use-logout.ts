import { axiosClient } from '@/api/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '~/src/core';

type Response = { error: string } & { data: {} };

const logout = async (): Promise<Response> => {
  return await axiosClient.post('auth/logout');
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => logout(),
    onMutate: async () => {
      await queryClient.cancelQueries();
    },
    onSettled: () => {
      signOut();
    },
  });
};
