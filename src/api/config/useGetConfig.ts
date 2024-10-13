import { axiosClient } from '@/api/shared';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Config } from '~/src/types/config';

type Variables = {
  version?: string;
};

export type ConfigResponse = {
  allConfig: Config;
  version?: string;
}

type Response = { error: string } & {
  data: ConfigResponse;
};

const getAll = async (params?: Variables): Promise<Response> => {
  return await axiosClient.get('config/getAll', { params });
};

export const useGetConfig = ({ version }: Variables) =>
  useQuery({
    queryKey: ['configs', version],
    queryFn: () => getAll({version}), 
    enabled: false
  });
