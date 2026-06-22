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
let lastPostStartedAt = 0;
let lastPostEndedAt = 0;

/** Sau khi POST kết thúc, bỏ qua so sánh status để FE kịp refetch/invalidate. */
const POST_ACTION_COOLDOWN_MS = 6000;

export const markPostStart = () => {
  postInFlight += 1;
  lastPostStartedAt = Date.now();
};

export const markPostEnd = () => {
  postInFlight = Math.max(0, postInFlight - 1);
  if (postInFlight === 0) {
    lastPostEndedAt = Date.now();
  }
};

export const isPostInFlight = () => postInFlight > 0;

export const isWithinPostActionCooldown = () => {
  if (postInFlight > 0) return true;
  if (lastPostEndedAt === 0) return false;
  return Date.now() - lastPostEndedAt < POST_ACTION_COOLDOWN_MS;
};

/** Không gọi poll mới khi đang POST hoặc trong cooldown. */
export const shouldSkipStatusPoll = () => isWithinPostActionCooldown();

/**
 * Bỏ qua kết quả `getOrderStatus` nếu POST xảy ra sau khi request poll bắt đầu.
 * Tránh case: GET đã gửi trước POST → response về sau với status cũ trong khi
 * FE đã refetch sau POST → so sánh sai → popup liên tục.
 */
export const shouldDiscardStatusPollResult = (pollStartedAt: number) => {
  if (isWithinPostActionCooldown()) return true;
  if (lastPostStartedAt > pollStartedAt) return true;
  if (lastPostEndedAt > pollStartedAt) return true;
  return false;
};
