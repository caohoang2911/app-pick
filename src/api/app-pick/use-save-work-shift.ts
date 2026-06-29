import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '~/src/api/shared/api-provider';
import { setLoading } from '~/src/core/store/loading';
import type { SaveWorkShiftPayload } from '~/src/types/work-shift';

type Variables = {
  data: SaveWorkShiftPayload;
};

type Response = { error: string } & {
  data: 'SUCCESS' | string;
};

const saveWorkShift = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/savePickerWorkShift', params);
};

export const useSaveWorkShift = (cb?: () => void) =>
  useMutation({
    mutationFn: (params: Variables) => saveWorkShift(params),
    onMutate: () => setLoading(true),
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data?.error) {
        queryClient.invalidateQueries({
          queryKey: ['getListPickerWorkShifts'],
        });
        cb?.();
      }
    },
    onError: () => setLoading(false),
  });
