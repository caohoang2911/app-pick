import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  status?: OrderStatus;
  keyword?: string;
};

export type SearchOrdersResponse = {
  total: number;
  toOffset: number;
  pageIndex: number;
  fromOffset: number;
  maxItemDisplay: number;
  list: Array<any>;
};

type Response = { error: string } & {
  data: SearchOrdersResponse;
};

const searchOrders = async (filter?: Variables): Promise<Response> => {
  const params = {
    filter: JSON.stringify({ ...filter }),
  };

  return await axiosClient.get('app-pick/searchOrders', { params });
};
export const useSearchOrders = (params?: Variables) =>
  useQuery({
    queryKey: ['searchOrders'],
    queryFn: () => {
      return searchOrders(params);
    },
    enabled: !!params,
  });
