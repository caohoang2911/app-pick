import type { AxiosError } from 'axios';

import { axiosClient } from '@/api/shared';
import { createQuery } from 'react-query-kit';
import { useQuery } from '@tanstack/react-query';

type Variables = {
  deliveryType: string;
  operationType: string;
};

export type OrderCounterResponse = {
  ALL?: number;
  STORE_PICKING?: number;
  CONFIRMED?: number;
  STORE_PACKED?: number;
};

type Response = { error: string } & {
  data: OrderCounterResponse;
};

const getCounter = async (deliveryType: string, operationType: string): Promise<Response> => {

  const params = {
    deliveryType,
    operationType,
  };

  return await axiosClient.get('app-pick/getOrderStatusCounters', { params });
};
export const useGetOrderStatusCounters = ({ deliveryType, operationType }: Variables) =>
  useQuery({
    queryKey: ['getOrderStatusCounters', deliveryType, operationType],
    queryFn: () => {
      return getCounter(deliveryType, operationType);
    },
  });
