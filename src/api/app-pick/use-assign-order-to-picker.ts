import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { UserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
  pickerId: string;
};

type Response = { error: string } & {
  data: UserInfo;
};

const assignOrderToPicker = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/assignOrderToPicker', params);
};

export const useAssignOrderToPicker = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => assignOrderToPicker(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        cb?.();
      } else {
        setLoading(false);
      }
    },
  });
};
