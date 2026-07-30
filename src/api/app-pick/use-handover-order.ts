import { axiosClient, queryClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
  proofImages?: string[];
};

type Response = { error: string } & AxiosResponse;

const handoverOrder = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/handoverOrder', params);
};

export const useHandoverOrder = (cb?: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => handoverOrder(params),
    onSuccess: (data: Response, variables: Variables) => {
      if (!data.error) {
        queryClient.invalidateQueries({
          queryKey: ['orderDetail', variables.orderCode],
        });
        cb?.();
      }
    },
    // Lỗi transport (mạng rớt / 5xx → axios throw): caller thường setLoading(true)
    // trước khi gọi, mà throw ở đây không được nhánh onSuccess xử lý → phải tắt
    // loading ở đây, nếu không app kẹt sau overlay Loading toàn màn.
    onError: () => {
      setLoading(false);
    },
  });
};
