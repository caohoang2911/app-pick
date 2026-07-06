import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';

export type StoreEmployeeItem = {
  id?: number;
  name: string;
  username: string;
  storeCode?: string;
  role: string;
  status: string;
  [key: string]: any;
};

type Filter = {
  keyword?: string;
};

// Endpoint trả về TẤT CẢ nhân viên của siêu thị (mọi role + mọi trạng thái, gồm
// cả "Ngưng hoạt động") — scope theo store của caller qua token zas.
type Response = { error?: string } & {
  data: StoreEmployeeItem[] | { list?: StoreEmployeeItem[] } | null;
};

const searchStoreEmployees = async (filter: Filter): Promise<Response> => {
  // Theo convention searchOrders/getListPickerWorkShifts: GET + filter JSON-hoá.
  return await axiosClient.get('app-pick/searchStoreEmployees', {
    params: {
      filter: JSON.stringify(filter),
    },
  });
};

const extractList = (data: Response['data']): StoreEmployeeItem[] => {
  if (Array.isArray(data)) return data;
  return data?.list ?? [];
};

export const useSearchStoreEmployees = (keyword = '', enabled = true) =>
  useQuery({
    queryKey: ['searchStoreEmployees', keyword],
    queryFn: () => searchStoreEmployees({ keyword }),
    enabled,
    staleTime: 30_000,
    select: (res: Response) => extractList(res?.data),
  });
