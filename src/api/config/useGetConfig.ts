import { axiosClient } from '@/api/shared';
import { getStoredConfigVersion } from '@/core/store/config';
import { useQuery } from '@tanstack/react-query';
import type { ConfigResponse } from './types';

export type { ConfigResponse } from './types';

type Variables = {
  version?: string;
};

type Response = { error: string } & {
  data: ConfigResponse;
};

const getAll = async (params?: Variables): Promise<Response> => {
  return await axiosClient.get('config/getAll', { params });
};

type UseGetConfigOptions = {
  /** Khi đã có version local: tắt auto-fetch, chỉ gọi API qua refetch() */
  localVersion: string;
};

export const useGetConfig = ({ localVersion }: UseGetConfigOptions) =>
  useQuery({
    queryKey: ['configs'],
    queryFn: () => {
      const v = getStoredConfigVersion();
      return getAll(v ? { version: v } : undefined);
    },
    enabled: !localVersion,
  });
