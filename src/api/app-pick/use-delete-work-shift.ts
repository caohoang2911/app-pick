import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '~/src/api/shared/api-provider';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  workShiftId: number;
};

type Response = { error: string } & {
  data: 'SUCCESS' | string;
};

const deleteWorkShift = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/deleteWorkShift', params);
};

export const useDeleteWorkShift = (cb?: () => void) =>
  useMutation({
    mutationFn: (params: Variables) => deleteWorkShift(params),
    onMutate: () => setLoading(true),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data?.error) {
        queryClient.invalidateQueries({ queryKey: ['getListWorkShifts'] });
        cb?.();
      }
    },
    onError: () => setLoading(false),
  });
