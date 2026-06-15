import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { getOrderStatus } from '~/src/api/app-pick/get-order-status';
import { queryClient } from '~/src/api/shared';
import { isPostInFlight } from '~/src/api/shared/http-busy';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { OrderDetail } from '~/src/types/order-pick';
import { useRole } from './useRole';

/** Worker chạy mỗi 3s (theo yêu cầu). */
const POLL_INTERVAL_MS = 3000;
/** stackId để alert "đơn thay đổi" chỉ tồn tại một bản trong queue. */
const STATUS_CHANGED_ALERT_STACK_ID = 'order-status-changed';

type OrderDetailCache = { data?: OrderDetail } | undefined;

type Options = {
  /** Tắt auto-refresh (mặc định bật). */
  enabled?: boolean;
};

/**
 * Auto-refresh theo order status.
 *
 * Cứ mỗi {@link POLL_INTERVAL_MS} gọi `getOrderStatus(orderCode)`, so sánh với
 * status đang hiển thị ở FE (đọc từ cache React Query `['orderDetail', code]`).
 * Nếu khác nhau → show popup "Đơn hàng có thay đổi, vui lòng cập nhật lại".
 * Bấm xác nhận → refetch order detail tại chỗ.
 *
 * Quy tắc:
 * - Chỉ chạy khi màn đang focus (dùng `useFocusEffect`) → tránh nhiều màn trong
 *   stack cùng poll một đơn.
 * - BE trả null/empty → BỎ QUA, không so sánh.
 * - Đang có HTTP POST bay (xem `http-busy`) → tạm dừng tick để tránh xung đột API;
 *   POST xong (dù lỗi hay không) tick sau sẽ tự chạy lại.
 * - Toàn bộ tick bọc try/catch → timer không bao giờ chết vĩnh viễn.
 * - Sau khi đã show popup thì ngừng poll cho tới khi user bấm cập nhật (tránh
 *   hỏi lại liên tục mỗi 3s).
 */
export const useOrderStatusAutoRefresh = (
  orderCode?: string,
  options?: Options,
) => {
  const role = useRole();
  const enabled = options?.enabled ?? true;

  // Tránh chồng request và tránh show popup nhiều lần.
  const isCheckingRef = useRef(false);
  const hasShownRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !orderCode) return;

      // Re-arm mỗi khi focus lại / đổi đơn.
      hasShownRef.current = false;
      isCheckingRef.current = false;

      let cancelled = false;

      const getFeStatus = () => {
        const cached = queryClient.getQueryData<OrderDetailCache>([
          'orderDetail',
          orderCode,
        ]);
        return cached?.data?.header?.status;
      };

      const showStatusChangedAlert = () => {
        hasShownRef.current = true;
        showAlert({
          title: 'Đơn hàng có thay đổi!',
          confirmText: 'Cập nhật lại',
          isHideCancelButton: true,
          blockDismiss: true,
          stackId: STATUS_CHANGED_ALERT_STACK_ID,
          onConfirm: () => {
            hideAlert();
            // Tải lại đơn tại chỗ → status FE cập nhật theo BE.
            queryClient.invalidateQueries({
              queryKey: ['orderDetail', orderCode],
            });
            // Cho phép phát hiện thay đổi tiếp theo.
            hasShownRef.current = false;
          },
        });
      };

      const tick = async () => {
        if (cancelled) return;
        if (isCheckingRef.current) return; // đang có request status chạy
        if (hasShownRef.current) return; // đã show popup, chờ user cập nhật
        if (isPostInFlight()) return; // pause khi đang có POST → tránh conflict

        const feStatus = getFeStatus();
        if (!feStatus) return; // FE chưa có status → chưa so sánh

        isCheckingRef.current = true;
        try {
          const beStatus = await getOrderStatus(orderCode, role);
          if (cancelled) return;
          if (!beStatus) return; // BE null/empty → bỏ qua
          if (beStatus !== feStatus) {
            showStatusChangedAlert();
          }
        } catch {
          // Nuốt lỗi để timer không dừng vĩnh viễn.
        } finally {
          isCheckingRef.current = false;
        }
      };

      const intervalId = setInterval(() => {
        // Bọc thêm một lớp cho chắc, dù tick đã tự try/catch.
        void tick();
      }, POLL_INTERVAL_MS);

      return () => {
        cancelled = true;
        clearInterval(intervalId);
      };
    }, [enabled, orderCode, role]),
  );
};
