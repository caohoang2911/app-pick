import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../shared';

interface GetStoreEmployeeProfileParams {
  employeeCode: string;
}

interface StoreEmployeeProfile {
  id: number;
  name: string;
  phone: string;
  username: string;
  storeCode: string;
  fcmToken?: string;
  role: string;
  status: string;
  tenants: string[];
  createdTime: number;
  lastAccessedTime: number;
}

interface GetStoreEmployeeProfileResponse {
  data: StoreEmployeeProfile;
}

const getStoreEmployeeProfile = async (params: GetStoreEmployeeProfileParams): Promise<GetStoreEmployeeProfileResponse> => {
  const response = await axiosClient.get('/app-pick/getStoreEmployeeProfile', {
    params: { employeeCode: params.employeeCode }
  });

  return response;
};

export const useGetStoreEmployeeProfile = (params: GetStoreEmployeeProfileParams) => {
  return useQuery({
    queryKey: ['getStoreEmployeeProfile', params],
    queryFn: () => getStoreEmployeeProfile(params),
    enabled: !!params.employeeCode && params.employeeCode.trim() !== '',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export type { GetStoreEmployeeProfileParams, StoreEmployeeProfile };
