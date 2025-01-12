
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  operationType: string;
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

const getCounter = async (operationType?: string | null, storeCode?: string | null): Promise<Response> => {

  const params = {
    operationType,
    storeCode,
  };

  return await axiosClient.get('app-pick/getOrderStatusCounters', { params });
};
export const useGetOrderStatusCounters = ({ operationType, storeCode }: Variables) =>
  useQuery({
    queryKey: ['getOrderStatusCounters', operationType, storeCode],
    queryFn: () => {
      return getCounter(operationType, storeCode);
    },
    enabled: !!operationType && !!storeCode
  });
