import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../shared';

interface RemoveStoreEmployeeParams {
  employeeCode: string;
}

interface RemoveStoreEmployeeResponse {
  error?: string;
  data?: any;
}

const removeStoreEmployee = async (params: RemoveStoreEmployeeParams): Promise<RemoveStoreEmployeeResponse> => {
  const response = await axiosClient.post('/app-pick/removeStoreEmployee', {
    employeeCode: params.employeeCode
  });

  return response.data;
};

export const useRemoveStoreEmployee = (onSuccess?: () => void, onError?: (error: string) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStoreEmployee,
    onSuccess: (data) => {
      if (data.error) {
        onError?.(data.error);
      } else {
        // Invalidate and refetch employee list
        queryClient.invalidateQueries({ queryKey: ['searchStoreEmployees'] });
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi xóa nhân viên';
      onError?.(errorMessage);
    },
  });
}; 