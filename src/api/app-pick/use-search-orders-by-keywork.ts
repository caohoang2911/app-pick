import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { useRole } from '~/src/core/hooks/useRole';
import { Role } from '~/src/types/employee';

type Response = { error: string } & {
  data: Array<any> | undefined;
} | any;

const searchOrdersByKeyword = async (keyword?: string, role?: Role): Promise<Response> => {

  const contextPath = role === Role.DRIVER ? 'app-pick-driver' : 'app-pick';
  return await axiosClient.get(`${contextPath}/suggestOrdersByKeyword`, { params: { keyword } });
};

export const useSearchOrdersByKeywork = (keyword?: string, options?: any, queryKey?: string) => {
  const role = useRole();
  return useQuery({
    queryKey: [queryKey || 'searchOrdersByKeywork', keyword],
    queryFn: () => searchOrdersByKeyword(keyword, role),
    enabled: !!keyword,
    ...options,
  }); 

}
