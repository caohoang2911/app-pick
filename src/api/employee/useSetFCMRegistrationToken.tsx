import { createMutation } from 'react-query-kit';
import { axiosClient } from '../shared';
import { AxiosError } from 'axios';

const setFCMRegistrationToken = async (params: any) => {
  return await axiosClient.post('employee/setFCMRegistrationToken', params);
};

// type Variables = { title: string; body: string; userId: number };

export const useSetFCMRegistrationToken = createMutation<any, any, AxiosError>({
  mutationFn: async (params: any) =>
    setFCMRegistrationToken(params).then((response) => response.data),
});
