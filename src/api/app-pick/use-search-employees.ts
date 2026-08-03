import { useQuery } from '@tanstack/react-query';
import { suggestStoreEmployeesByKeyword } from '~/src/api/app-pick/use-suggest-store-employees-by-keyword';

export type SearchEmployeeItem = {
  id: number;
  name: string;
  username: string;
  storeCode: string;
  role: string;
  status: string;
  tenants: string[];
  createdTime: number;
  lastAccessedTime: number;
};

type Response = { error: string } & {
  data: SearchEmployeeItem[];
};

/** Search NV theo keyword — không gửi roles/status, để server tự xử lý. */
export const useSearchEmployees = (keyword = '', enabled = true) =>
  useQuery({
    queryKey: ['suggestStoreEmployeesByKeyword', keyword],
    queryFn: (): Promise<Response> =>
      suggestStoreEmployeesByKeyword({ keyword }),
    enabled,
    staleTime: 30_000,
  });
