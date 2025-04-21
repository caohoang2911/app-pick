
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  keyword: string;
};

type Response = { error: string } & {
  data: {
    id: number;
    name: string;
    username: string;
    storeCode: string;
    role: string;
    status: string;
    tenants: string[];
    createdTime: number;
    lastAccessedTime: number;
  }[];
};

const suggestStoreEmployeesByKeyword = async (keyword?: string): Promise<Response> => {

  const params = {
    keyword,
  };

  return await axiosClient.get('app-pick/suggestStoreEmployeesByKeyword', { params });
};

export const useSuggestStoreEmployeesByKeyword = (keyword?: string) =>
  useQuery({
    queryKey: ['suggestStoreEmployeesByKeyword', keyword],
    queryFn: () => {
      return suggestStoreEmployeesByKeyword(keyword);
    },
    enabled: !!keyword
  });
