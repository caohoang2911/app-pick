import type { AxiosError } from 'axios';

import { axiosClient } from '@/api/shared';
import { createQuery } from 'react-query-kit';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  deliveryType: string;
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

const getCounter = async (deliveryType: string, operationType: string, storeCode: string): Promise<Response> => {

  const params = {
    deliveryType,
    operationType,
    storeCode,
  };

  return await axiosClient.get('app-pick/getOrderStatusCounters', { params });
};
export const useGetOrderStatusCounters = ({ deliveryType, operationType, storeCode }: Variables) =>
  useQuery({
    queryKey: ['getOrderStatusCounters', deliveryType, operationType, storeCode],
    queryFn: () => {
      return getCounter(deliveryType, operationType, storeCode);
    },
  });
