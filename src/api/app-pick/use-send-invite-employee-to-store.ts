import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../shared';

interface SendInviteEmployeeToStoreParams {
  employeeCode: string;
}

interface SendInviteEmployeeToStoreResponse {
  data: string;
}

const sendInviteEmployeeToStore = async (params: SendInviteEmployeeToStoreParams): Promise<SendInviteEmployeeToStoreResponse> => {
  const response = await axiosClient.post('/app-pick/sendInviteEmployeeToStore', {
    employeeCode: params.employeeCode
  });

  return response.data;
};

export const useSendInviteEmployeeToStore = (onSuccess?: () => void, onError?: (error: string) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendInviteEmployeeToStore,
    onSuccess: (data: any) => {
      if (data === 'SUCCESS') {
        // Invalidate and refetch employee list
        queryClient.invalidateQueries({ queryKey: ['searchStoreEmployees'] });
        onSuccess?.();
      } else {
        onError?.('Có lỗi xảy ra khi gửi lời mời');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi gửi lời mời';
      onError?.(errorMessage);
    },
  });
}; 