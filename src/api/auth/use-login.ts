import { createMutation } from 'react-query-kit';
import { axiosClient } from '../shared';
import { AxiosError } from 'axios';

const login = async () => {
  console.log(process.env);
  return await axiosClient.post('auth/genHRVLoginURL');
};

// type Variables = { title: string; body: string; userId: number };

export const useLogin = createMutation<Response, void, AxiosError>({
  mutationFn: async () => login().then((response) => response.data),
});
