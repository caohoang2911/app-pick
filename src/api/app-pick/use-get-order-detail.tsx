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
  return await axiosClient.get(`order/getOrderDetail`, { params });
};

export const SHARE_SECRET_KEY = 'uifTjoY24DRGWz3NjcVa7w';

const getDetailShareOrder = async ({
  orderCode,
}: Variables): Promise<Response> => {
  const params = {
    orderCode,
    secretKey: SHARE_SECRET_KEY,
  };

  return await axiosClient.get(`share/order`, { params });
};

export const useOrderDetailQuery = ({ orderCode }: Variables) => {
  return useQuery({
    queryKey: ['orderDetail', orderCode],
    queryFn: () => {
      return getDetailOrder({ orderCode });
    },
    enabled: true,
  });
};

export const useOrderShareDetailQuery = ({ orderCode }: Variables) => {
  return useQuery({
    queryKey: ['useOrderShareDetailQuery'],
    queryFn: () => getDetailShareOrder({ orderCode }),
  });
};
