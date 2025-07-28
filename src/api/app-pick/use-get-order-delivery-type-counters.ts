
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { OrderStatus } from '~/src/types/order';

type Variables = {
  storeCode: string;
  status?: OrderStatus;
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
  data: {
    "CUSTOMER_PICKUP": number,
    "STORE_DELIVERY": number,
    "SHIPPER_DELIVERY": number
  };
};

const getOrderDeliveryTypeCounters = async (params: Variables): Promise<Response> => {  
  if(params.status === 'ALL') {
    delete params.status;
  }

  return await axiosClient.get('app-pick/getOrderDeliveryTypeCounters', { params });
};

export const useGetOrderDeliveryTypeCounters = ({ storeCode, status }: Variables) =>
  useQuery({
    queryKey: ['getOrderDeliveryTypeCounters', storeCode, status],
    queryFn: () => {
      return getOrderDeliveryTypeCounters({ storeCode, status });
    },
    enabled: !!storeCode && !!status
  });
