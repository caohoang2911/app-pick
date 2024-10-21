import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';


type Response = { error: string } & {
  data: {
    noti?: {
      isEnableOnline: true,
      isEnableHomedeli: true
    }
  };
};

const getSetting = async (): Promise<Response> => {
  return await axiosClient.get(`app-pick/getSetting`);
};

export const useGetSettingQuery = () => {
  return useQuery({
    queryKey: ['getSetting'],
    queryFn: () => {
      return getSetting();
    },
    enabled: true,
  });
};
