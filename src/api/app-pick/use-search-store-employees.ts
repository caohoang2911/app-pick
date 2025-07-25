import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../shared';

interface SearchStoreEmployeesParams {
  keyword?: string;
  storeCode: string;
  sortType?: number;
  pageIndex?: number;
  limit?: number;
  sortBy?: string;
}

interface StoreEmployee {
  id: number;
  name: string;
  username: string;
  storeCode: string;
  fcmToken?: string;
  role: string;
  status: string;
  tenants: string[];
  createdTime: number;
  lastAccessedTime: number;
}

interface SearchStoreEmployeesResponse {
  data: {
    total: number;
    toOffset: number;
    pageIndex: number;
    fromOffset: number;
    maxItemDisplay: number;
    list: StoreEmployee[];
  };
}

const searchStoreEmployees = async (params: SearchStoreEmployeesParams): Promise<SearchStoreEmployeesResponse> => {
  const filter = {
    keyword: params.keyword || '',
    storeCode: params.storeCode,
    sortType: params.sortType || -1,
    pageIndex: params.pageIndex || 1,
    limit: params.limit || 20,
    sortBy: params.sortBy || 'createdTime'
  };

  const response = await axiosClient.get('/app-pick/searchStoreEmployees', {
    params: { filter: JSON.stringify(filter) }
  });

  return response;
};

export const useSearchStoreEmployees = (params: SearchStoreEmployeesParams) => {
  return useQuery({
    queryKey: ['searchStoreEmployees', params],
    queryFn: () => searchStoreEmployees(params),
    enabled: !!params.storeCode && params.storeCode.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true, // Continue polling in background
  });
};

export type { StoreEmployee, SearchStoreEmployeesParams }; 