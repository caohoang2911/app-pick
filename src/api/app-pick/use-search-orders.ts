import { axiosClient } from '@/api/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import moment from 'moment';
import { OrderStatus } from '~/src/types/order';

type Variables = {
  status?: OrderStatus;
  keyword?: string;
  pageIndex?: number;
  expectedDeliveryTime?: string;
  deliveryType?: string;
  storeCode?: string;
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
  const filterCopy = {...filter};

  if(filter?.status === "ALL") {
    delete filterCopy.status;
  }

  console.log(filter, "filter")

  const params = {
    filter: JSON.stringify({ ...filterCopy }),
  };

  console.log(params, "params")

  return await axiosClient.get('app-pick/searchOrders', { params });
};

export const useSearchOrders = (params?: Variables) =>
  useInfiniteQuery({
    queryKey: ['searchOrders', params],
    queryFn: ({ pageParam = 0 }) => {
      return searchOrders({ ...params, pageIndex: pageParam });
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPageIndex = lastPage.data?.pageIndex + 1;
      return nextPageIndex < (lastPage.data?.total || 0) ? nextPageIndex : undefined;
    },
    select: (data) => ({
      pages: data.pages.flatMap(page => page.data?.list || []),
      pageParams: [...data.pageParams],
    }),
    enabled: !!params,
    initialPageParam: 0,
  });
