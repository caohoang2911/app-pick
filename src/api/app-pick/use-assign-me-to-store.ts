import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { UserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  storeCode?: number | string;
};

type Response = { error: string } & {
  data: UserInfo;
};

const assignMeToStore = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/assignMeToStore', params);
};

export const useAssignMeToStore = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => assignMeToStore(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        cb?.();
      }
      setLoading(false);
    },
  });
};