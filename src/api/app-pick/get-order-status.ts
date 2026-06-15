import { axiosClient } from '@/api/shared';
import { Role } from '~/src/types/employee';
import { OrderStatusValue } from '~/src/types/order';

/**
 * Response của `getOrderStatus`. BE có thể trả status ở nhiều dạng (chuỗi trực
 * tiếp hoặc bọc trong `{ status }`) nên xử lý phòng thủ ở `getOrderStatus`.
 */
type GetOrderStatusResponse = {
  error?: string;
  data?: OrderStatusValue | { status?: OrderStatusValue } | string | null;
};

/**
 * Lấy status mới nhất của đơn từ BE để so sánh với status đang hiển thị ở FE.
 *
 * Trả về `null` khi BE không trả status (null/empty) → caller phải BỎ QUA,
 * không so sánh gì cả (theo yêu cầu nghiệp vụ).
 *
 * Endpoint được role-aware giống `getOrderDetail`, và đã được thêm vào
 * `BLACK_LIST_SHOW_MESSAGE` trong `client.tsx` để poll nền không bắn flash khi lỗi.
 */
export const getOrderStatus = async (
  orderCode: string,
  role?: Role,
): Promise<OrderStatusValue | null> => {
  const contextPath = role === Role.DRIVER ? 'app-pick-driver' : 'app-pick';

  // axiosClient unwrap `response.data` → res chính là body `{ data, error }`.
  const res = (await axiosClient.get(`/${contextPath}/getOrderStatus`, {
    params: { orderCode },
  })) as unknown as GetOrderStatusResponse;

  const status = res?.data;

  return status as OrderStatusValue | null;
};
