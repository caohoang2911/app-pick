import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { setLoading } from '~/src/core/store/loading';
import { showMessage } from 'react-native-flash-message';
import { router } from 'expo-router';

type Variables = {
  employeeCode: string;
  storeCode: string;
};

type Response = { error: string } & {
  data: string;
};


const requestAssignMeToStore = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/requestAssignMeToStore', params);
};

export const useRequestAssignMeToStore = (newbie?: boolean, cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => requestAssignMeToStore(params),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {

        showMessage({
          message: 'Gửi yêu cầu cấp quyền siêu thị thành công',
          type: 'success',
        });
        cb?.();
        if(newbie) {
          router.replace('/login')
        }
      } else {
        showMessage({
          message: data.error,
          type: 'danger',
        });
      }
    },
  });
};