import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { EmployeeRole } from '~/src/types/employee';

export const DEFAULT_SUGGEST_STORE_EMPLOYEE_ROLES: EmployeeRole[] = [
  EmployeeRole.STORE,
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
];

type SuggestStoreEmployeeItem = {
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
  data: SuggestStoreEmployeeItem[];
};

type SuggestStoreEmployeesParams = {
  keyword?: string;
  roles?: EmployeeRole[];
  status?: string;
};

export const suggestStoreEmployeesByKeyword = async ({
  keyword,
  roles,
  status,
}: SuggestStoreEmployeesParams = {}): Promise<Response> => {
  return await axiosClient.get('app-pick/suggestStoreEmployeesByKeyword', {
    params: {
      keyword,
      ...(roles != null ? { roles } : {}),
      ...(status != null ? { status } : {}),
    },
  });
};

export const useSuggestStoreEmployeesByKeyword = (
  keyword?: string,
  roles: EmployeeRole[] = DEFAULT_SUGGEST_STORE_EMPLOYEE_ROLES,
  status = 'ACTIVE',
) =>
  useQuery({
    queryKey: ['suggestStoreEmployeesByKeyword', keyword, roles, status],
    queryFn: () => suggestStoreEmployeesByKeyword({ keyword, roles, status }),
    enabled: !!keyword,
  });
