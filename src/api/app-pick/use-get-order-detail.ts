import { axiosClient, queryClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { useRole } from '~/src/core/hooks/useRole';
import { Role } from '~/src/types/employee';
import { OrderDetail } from '~/src/types/order-pick';

/** Stable fallback — never use inline `{}` or every render gets a new reference and breaks effect deps. */
const EMPTY_ORDER_DETAIL = {} as OrderDetail;

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {
  data: OrderDetail;
};

const getDetailOrder = async (
  { orderCode }: Variables,
  role?: Role,
): Promise<Response> => {
  const params = {
    orderCode,
  };
  const contextPath = role === Role.DRIVER ? 'app-pick-driver' : 'app-pick';
  return await axiosClient.get(`${contextPath}/getOrderDetail`, { params });
};

type PrefetchVariables = {
  orderCode?: string;
  isDriver?: boolean;
};

export const prefetchOrderDetailForCode = async ({
  orderCode,
  isDriver = false,
}: PrefetchVariables) => {
  if (!orderCode) return;
  const role = isDriver ? Role.DRIVER : undefined;
  return queryClient.prefetchQuery({
    queryKey: ['orderDetail', orderCode],
    queryFn: () => getDetailOrder({ orderCode }, role),
    staleTime: 30 * 1000,
  });
};

const useOrderDetailQuery = ({ orderCode }: Variables) => {
  const role = useRole();
  return useQuery({
    queryKey: ['orderDetail', orderCode],
    queryFn: () => {
      return getDetailOrder({ orderCode }, role);
    },
    enabled: !!orderCode,
    staleTime: 30 * 1000,
    gcTime: Infinity,
  });
};

/**
 * Một nguồn order detail từ React Query cache theo code.
 */
export const useOrderDetailForCode = (orderCode: string | undefined) => {
  const query = useOrderDetailQuery({ orderCode });
  const isOrderDetailPending = query.isLoading;
  const isOrderDetailFetching = query.isFetching;
  const orderDetail = query.data?.data;
  const orderDetailError = query.data?.error;
  const hasOrderDetail = !!orderDetail;
  const isOrderDetailLoading = isOrderDetailPending;

  return {
    ...query,
    isOrderDetailPending,
    isOrderDetailFetching,
    isOrderDetailLoading,
    orderDetailError,
    hasOrderDetail,
    orderDetail: orderDetail ?? EMPTY_ORDER_DETAIL,
  };
};
