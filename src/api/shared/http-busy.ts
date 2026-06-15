/**
 * Theo dõi số request HTTP POST đang "bay" (in-flight).
 *
 * Auto-refresh theo order status (xem `useOrderStatusAutoRefresh`) sẽ tạm dừng
 * việc gọi `getOrderStatus` khi đang có POST chạy, tránh xung đột API
 * (đọc status ngay lúc client đang ghi dữ liệu).
 *
 * Counter được tăng/giảm tập trung trong interceptor của `axiosClient`
 * (xem `client.tsx`): tăng ở request interceptor cho method POST, giảm ở cả
 * nhánh response thành công lẫn lỗi — nên dù request lỗi, counter vẫn được trả
 * về, không bị kẹt > 0 vĩnh viễn.
 */
let postInFlight = 0;

export const markPostStart = () => {
  postInFlight += 1;
};

export const markPostEnd = () => {
  // Không cho âm để phòng trường hợp giảm thừa.
  postInFlight = Math.max(0, postInFlight - 1);
};

export const isPostInFlight = () => postInFlight > 0;
