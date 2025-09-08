
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

type Variables = {};

export type OrderCounterResponse = {
  ALL?: number;
  STORE_PICKING?: number;
  CONFIRMED?: number;
  STORE_PACKED?: number;
  SHIPPER_DELIVERY?: number;
  CUSTOMER_PICKUP?: number;
  STORE_DELIVERY?: number;
};

type Response = { error: string } & {
  data: OrderCounterResponse;
};

const getCounter = async (): Promise<Response> => {
  return await axiosClient.get('app-pick/getOrderStatusCounters');
};
export const useGetOrderStatusCounters = () =>
  useQuery({
    queryKey: ['getOrderStatusCounters'],
    queryFn: () => {
      return getCounter();
    },
    enabled: true
  });
