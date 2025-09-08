
import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { useRole } from '~/src/core/hooks/useRole';
import { Role } from '~/src/types/employee';

type Variables = {
  role: Role;
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

const getCounter = async (role: Role): Promise<Response> => {
  const contextPath = role === Role.DRIVER ? 'app-pick-driver' : 'app-pick';
  
  return await axiosClient.get(`${contextPath}/getOrderStatusCounters`);
};
export const useGetOrderStatusCounters = () => {

  const role = useRole();
  
  return  useQuery({
    queryKey: ['getOrderStatusCounters'],
    queryFn: () => {
      return getCounter(role as Role);
    },
    enabled: true
  });
}