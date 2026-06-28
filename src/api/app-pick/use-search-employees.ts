import { useQuery } from '@tanstack/react-query';
import { suggestStoreEmployeesByKeyword } from '~/src/api/app-pick/use-suggest-store-employees-by-keyword';
import type { EmployeeRole } from '~/src/types/employee';

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

export const useSearchEmployees = (
  keyword = '',
  roles?: EmployeeRole[],
  enabled = true,
) =>
  useQuery({
    queryKey: ['suggestStoreEmployeesByKeyword', keyword, roles],
    queryFn: (): Promise<Response> =>
      suggestStoreEmployeesByKeyword({ keyword, roles }),
    enabled,
    staleTime: 30_000,
  });
