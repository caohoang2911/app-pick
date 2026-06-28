import { axiosClient } from '@/api/shared';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

type Response = { error: string } & {
  data: number;
};

const getUnseenNotiCounter = async (): Promise<Response> => {
  return await axiosClient.get('app-pick/getUnseenNotiCounter');
};

export const UNSEEN_NOTI_COUNTER_POLL_MS = 3000;

type UseGetUnseenNotiCounterOptions = {
  enabled?: boolean;
  refetchInterval?: UseQueryOptions<Response>['refetchInterval'];
};

export const useGetUnseenNotiCounter = (
  enabled = true,
  options?: UseGetUnseenNotiCounterOptions,
) =>
  useQuery({
    queryKey: ['getUnseenNotiCounter'],
    queryFn: getUnseenNotiCounter,
    enabled: enabled && (options?.enabled ?? true),
    staleTime: 0,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
