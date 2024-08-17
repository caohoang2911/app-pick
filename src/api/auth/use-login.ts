import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';

type Response = { error: string } & { data: {} };

const genHRVLoginURL = async (): Promise<Response> => {
  return await axiosClient.post('auth/genHRVLoginURL');
};

export const useLogin = () => {
  return useMutation({
    mutationKey: ['genHRVLoginURL'],
    mutationFn: () => genHRVLoginURL(),
  });
};
