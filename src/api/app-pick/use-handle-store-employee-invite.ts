import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../shared';
import { showMessage } from 'react-native-flash-message';

interface HandleStoreEmployeeInviteParams {
  inviteToken: string;
  action: 'ACCEPT' | 'DECLINE';
}

interface HandleStoreEmployeeInviteResponse {
  data: string;
  error?: string;
}

const handleStoreEmployeeInvite = async (params: HandleStoreEmployeeInviteParams): Promise<HandleStoreEmployeeInviteResponse> => {
  let endpoint: string;
  let payload: any;

  if (params.action === 'ACCEPT') {
    endpoint = '/app-pick/acceptInviteEmployeeToStore';
    payload = {
      inviteToken: params.inviteToken
    };
  } else {
    // For decline, we'll use a different endpoint or handle differently
    endpoint = '/app-pick/declineInviteEmployeeToStore';
    payload = {
      inviteToken: params.inviteToken
    };
  }

  const response = await axiosClient.post(endpoint, payload);
  return response.data;
};

export const useHandleStoreEmployeeInvite = (onSuccess?: () => void, onError?: (error: string) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: handleStoreEmployeeInvite,
    onSuccess: (data: HandleStoreEmployeeInviteResponse) => {
      if (data.data === 'SUCCESS') {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: ['searchStoreEmployees'] });
        queryClient.invalidateQueries({ queryKey: ['userInfo'] });
        
        // Show success message
        showMessage({
          type: 'success',
          message: 'Đã xử lý lời mời thành công!'
        });
        
        onSuccess?.();
      } else {
        const errorMessage = data.error || 'Có lỗi xảy ra khi xử lý lời mời';
        onError?.(errorMessage);
      }
    },
    onError: (error: any) => {
      console.log('error', error);
    },
  });
}; 