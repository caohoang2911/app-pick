import { createMutation } from 'react-query-kit';
import { axiosClient } from '../shared';
import { AxiosError } from 'axios';

const sendFCMNotification = async (params: any) => {
  return await axiosClient.post('employee/sendFCMNotification', params);
};

// type Variables = { title: string; body: string; userId: number };

export const useSendFCMNotification = createMutation<any, any, AxiosError>({
  mutationFn: async (params: any) =>
    sendFCMNotification(params).then((response) => response.data),
});
