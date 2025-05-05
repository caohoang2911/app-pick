import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { OrderDetail } from '~/src/types/order-detail';

type Variables = {
  orderCode?: string;
};

type Response = { error: string } & {
  data: OrderDetail;
};

const getDetailOrder = async ({ orderCode }: Variables): Promise<Response> => {
  const params = {
    orderCode,
  };
  return await axiosClient.get(`app-pick/getOrderDetail`, { params });
};

export const SHARE_SECRET_KEY = 'uifTjoY24DRGWz3NjcVa7w';

export const useOrderDetailQuery = ({ orderCode }: Variables) => {
  return useQuery({
    queryKey: ['orderDetail', orderCode],
    queryFn: () => {
      return getDetailOrder({ orderCode });
    },
    enabled: !!orderCode,
    staleTime: 300000,
    gcTime: Infinity,
  });
};
