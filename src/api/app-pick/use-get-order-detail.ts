import { useEffect } from 'react';
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { OrderDetail } from '~/src/types/order-pick';
import { useRole } from '~/src/core/hooks/useRole';
import { setOrderDetailForCode } from '~/src/core/store/order-detail';
import { useOrderDetailStore } from '~/src/core/store/order-detail';
import { Role } from '~/src/types/employee';

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

export const SHARE_SECRET_KEY = 'uifTjoY24DRGWz3NjcVa7w';

export const useOrderDetailQuery = ({ orderCode }: Variables) => {
  const role = useRole();
  return useQuery({
    queryKey: ['orderDetail', orderCode],
    queryFn: () => {
      return getDetailOrder({ orderCode }, role);
    },
    enabled: !!orderCode,
    staleTime: 0,
    gcTime: Infinity,
  });
};

/**
 * Một nguồn order detail: fetch và sync vào store theo code.
 * Trả về orderDetail từ store (đúng đơn), tránh dính đơn khác.
 */
export const useOrderDetailForCode = (orderCode: string | undefined) => {
  const query = useOrderDetailQuery({ orderCode });
  const orderDetail = useOrderDetailStore((s) =>
    orderCode ? s.orderDetails[orderCode] : undefined,
  );

  useEffect(() => {
    if (orderCode && query.data?.data) {
      setOrderDetailForCode(orderCode, query.data.data);
    }
  }, [orderCode, query.data]);

  return {
    ...query,
    orderDetail: orderDetail ?? ({} as OrderDetail),
  };
};
