import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

export type TeleMentionedEmployee = {
  id?: number;
  username: string;
  name?: string;
  teleId?: string | number;
  role?: string;
  status?: string;
  [key: string]: any;
};

export type MyStoreDetail = {
  teleGroupLink?: string;
  teleMentionedEmployees?: TeleMentionedEmployee[];
  [key: string]: any;
};

type Response = { error?: string } & { data: MyStoreDetail | null };

const getMyStoreDetail = async (): Promise<Response> => {
  return await axiosClient.get('app-pick/getMyStoreDetail');
};

/** Chi tiết siêu thị hiện tại — gồm link nhóm Tele + danh sách nhận mention. */
export const useGetMyStoreDetail = (enabled = true) => {
  return useQuery({
    queryKey: ['getMyStoreDetail'],
    queryFn: getMyStoreDetail,
    enabled,
    staleTime: 30_000,
    select: (res: Response) => res?.data ?? null,
  });
};
