
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '~/src/core';
import { OrderStatus } from '~/src/types/order';

type Variables = {
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

export const useGetOrderDeliveryTypeCounters = ({ status }: Variables) => {
  const authStatus = useAuth.use.status();
  
  const query = useQuery({
    queryKey: ['getOrderDeliveryTypeCounters', status],
    queryFn: () => {
      return getOrderDeliveryTypeCounters({ status });
    },
    enabled: !!status && authStatus === 'signIn'
  });

  // Override refetch để kiểm tra điều kiện auth
  const originalRefetch = query.refetch;
  const safeRefetch = () => {
    if (authStatus === 'signIn') {
      return originalRefetch();
    }
    return Promise.resolve({ data: null, error: null, isError: false, isLoading: false });
  };

  return {
    ...query,
    refetch: safeRefetch
  };
};
