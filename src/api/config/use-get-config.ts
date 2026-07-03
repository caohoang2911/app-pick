import { axiosClient } from '@/api/shared';
import { getStoredConfigVersion, setConfig } from '@/core/store/config';
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
    queryFn: async () => {
      const v = getStoredConfigVersion();
      const res = await getAll(v ? { version: v } : { version: '' });
      // Persist ngay khi fetch thành công. react-query v5 bỏ onSuccess của
      // useQuery nên gom vào queryFn: mọi nơi dùng useGetConfig tự đồng bộ
      // config vào store (MMKV + zustand), chạy đúng 1 lần mỗi lần fetch thật.
      if (!res?.error && res?.data) {
        setConfig(res.data as ConfigResponse);
      }
      return res;
    },
    enabled: !localVersion,
  });
