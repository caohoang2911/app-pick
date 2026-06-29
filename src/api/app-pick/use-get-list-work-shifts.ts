import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { getDefaultWorkShiftTimeRange } from '~/src/core/utils/work-shift';
import type { WorkShift } from '~/src/types/work-shift';

type Response = { error: string } & {
  data: WorkShift[];
};

const getListWorkShifts = async (timeRange: string): Promise<Response> => {
  return await axiosClient.get('app-pick/getListPickerWorkShifts', {
    params: {
      filter: JSON.stringify({ timeRange }),
    },
  });
};

export const useGetListWorkShifts = (timeRange?: string, enabled = true) => {
  const range = timeRange ?? getDefaultWorkShiftTimeRange().timeRangeFilter;

  return useQuery({
    queryKey: ['getListPickerWorkShifts', range],
    queryFn: () => getListWorkShifts(range),
    enabled,
    staleTime: 0,
  });
};
