import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { useRefreshToken } from '../auth/use-refresh-token';
import { axiosClient } from '../shared';

interface AcceptInviteEmployeeToStoreParams {
  inviteToken: string;
}

type AcceptInviteEmployeeToStoreResponse = any;

const acceptInviteEmployeeToStore = async (params: AcceptInviteEmployeeToStoreParams): Promise<AcceptInviteEmployeeToStoreResponse> => {  
  return await axiosClient.post('/app-pick/acceptInviteEmployeeToStore', params);
};

export const useAcceptInviteEmployeeToStore = (onSuccess?: () => void, onError?: (error: string) => void) => {
  const queryClient = useQueryClient();
  const { mutate: refreshToken } = useRefreshToken(() => {
    queryClient.invalidateQueries({ queryKey: ['searchStoreEmployees'] });
    queryClient.invalidateQueries({ queryKey: ['userInfo'] });
  });

  return useMutation({
    mutationFn: (params: AcceptInviteEmployeeToStoreParams) => acceptInviteEmployeeToStore(params),
    onSuccess: (data: AcceptInviteEmployeeToStoreResponse) => {
      if (data.data === 'SUCCESS') {
        // Invalidate and refetch relevant queries
        refreshToken();
        
        // Show success message
        showMessage({
          type: 'success',
          message: 'Đã chấp nhận lời mời thành công!'
        });
        
        onSuccess?.();
      } else {
        showMessage({
          type: 'danger',
          message: data.error
        });
      }
    },
  });
}; 