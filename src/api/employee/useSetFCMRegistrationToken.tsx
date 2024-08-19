import { useMutation } from '@tanstack/react-query';
import { axiosClient } from '../shared';

type Variables = { token: string };

type Response = { error: string } & {};

const setFCMRegistrationToken = async (
  params: Variables
): Promise<Response> => {
  return await axiosClient.post('employee/setFCMRegistrationToken', params);
};

export const useSetFCMRegistrationToken = () => {
  return useMutation({
    mutationFn: (params: Variables) => setFCMRegistrationToken(params),
  });
};
