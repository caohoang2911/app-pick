import { axiosClient } from '@/api/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

type Variables = {
  status?: OrderStatus;
  keyword?: string;
  pageIndex?: number;
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
} | any;

const searchOrders = async (filter?: Variables): Promise<Response> => {
  const params = {
    filter: JSON.stringify({ ...filter }),
  };

  return await axiosClient.get('app-pick/searchOrders', { params });
};
export const useSearchOrders = (params?: Variables) =>
  useInfiniteQuery({
    queryKey: ['searchOrders'],
    queryFn: () => {
      return searchOrders({...params})
    },
    getNextPageParam: (lastPage: any, pages) => lastPage.data?.pageIndex,
    select: (data) => ({
      pages: data.pages.flatMap(page => page.data?.list || []),
      pageParams: [...data.pageParams].reverse(),
    }),
    enabled: !!params,
    initialPageParam: 0,
  });
