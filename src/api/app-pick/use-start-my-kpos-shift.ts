import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { UserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';

type Variables = {};

type Response = { error: string } & {
  data: UserInfo;
};

const startMyKposShift = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/startMyKposShift', params);
};

export const useStartMyKposShift = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => startMyKposShift(params),
    onSuccess: (data: Response) => {
      if (!data.error) {
        cb?.();
      } else {
        setLoading(false);
        showMessage({
          message: data.error || 'Không thể vào ca. Vui lòng thử lại.',
          type: 'danger',
        });
      }
    },
    onError: () => {
      setLoading(false);
      showMessage({
        message: 'Không thể vào ca. Vui lòng thử lại.',
        type: 'danger',
      });
    },
  });
};
