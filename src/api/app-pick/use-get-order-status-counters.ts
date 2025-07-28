
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  storeCode: string;
};

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

const getCounter = async (storeCode?: string | null): Promise<Response> => {

  const params = {
    storeCode,
  };

  return await axiosClient.get('app-pick/getOrderStatusCounters', { params });
};
export const useGetOrderStatusCounters = ({ storeCode }: Variables) =>
  useQuery({
    queryKey: ['getOrderStatusCounters', storeCode],
    queryFn: () => {
      return getCounter(storeCode);
    },
    enabled: !!storeCode
  });
