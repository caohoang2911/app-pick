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
};

type Response = { error: string } & {
  data: {
    CUSTOMER_PICKUP: number;
    SHIPPER_DELIVERY: number;
  };
};

const getOrderDeliveryTypeCounters = async (
  params: Variables,
): Promise<Response> => {
  const normalizedParams =
    params.status === 'ALL' ? {} : { status: params.status };

  return await axiosClient.get('app-pick/getOrderDeliveryTypeCounters', {
    params: normalizedParams,
  });
};

export const useGetOrderDeliveryTypeCounters = ({ status }: Variables) => {
  const authStatus = useAuth.use.status();
  const canFetch = !!status && authStatus === 'signIn';

  const query = useQuery({
    queryKey: ['getOrderDeliveryTypeCounters', status],
    queryFn: async () => {
      if (!status) {
        return {
          error: '',
          data: {
            CUSTOMER_PICKUP: 0,
            SHIPPER_DELIVERY: 0,
          },
        };
      }

      return getOrderDeliveryTypeCounters({ status });
    },
    enabled: canFetch,
  });
  return query;
};
