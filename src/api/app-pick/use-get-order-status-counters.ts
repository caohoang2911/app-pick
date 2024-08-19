import type { AxiosError } from 'axios';

import { axiosClient } from '@/api/shared';
import { createQuery } from 'react-query-kit';
import { useQuery } from '@tanstack/react-query';

type Variables = void;

export type OrderCounterResponse = {
  ALL?: number;
  STORE_PICKING?: number;
  CONFIRMED?: number;
  STORE_PACKED?: number;
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
  });
