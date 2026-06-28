import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import type { AppNotification } from '~/src/types/notification';

type Response = { error: string } & {
  data: AppNotification[];
};

const pullNotis = async (): Promise<Response> => {
  return await axiosClient.get('app-pick/pullNotis');
};

export const usePullNotis = (enabled = true) =>
  useQuery({
    queryKey: ['pullNotis'],
    queryFn: pullNotis,
    enabled,
    staleTime: 0,
  });
