import { axiosClient } from '@/api/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import moment from 'moment';
import { setDeliveryType, setFromScanQrCode, setOperationType, setSelectedOrderCounter, useOrders } from '~/src/core/store/orders';
import { OrderStatus } from '~/src/types/order';

type Variables = {
  status?: OrderStatus;
  keyword?: string;
  pageIndex?: number;
  expectedDeliveryTime?: string;
  deliveryType?: string | null;
  operationType?: string | null;
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

  const params = {
    filter: JSON.stringify({ ...filterCopy }),
  };

  return await axiosClient.get('app-pick/searchOrders', { params });
};

export const useSearchOrders = (params?: Variables) =>
  useInfiniteQuery({
    queryKey: ['searchOrders', params],
    queryFn: ({ pageParam = 0 }) => {
      return searchOrders({ ...params, pageIndex: pageParam });
    },
    getNextPageParam: (lastPage, allPages) => {
      const pageIndex = lastPage.data?.pageIndex;
      return pageIndex < Math.ceil(lastPage.data?.total / lastPage.data?.maxItemDisplay) ? pageIndex + 1 : undefined;
    },
    select: (data) => {
      return ({
        pages: data.pages.flatMap(page => page.data?.list || []),
        pageParams: [...data.pageParams],
      })
    },
    enabled: !!params,
    initialPageParam: 1,
  });
