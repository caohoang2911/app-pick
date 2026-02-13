import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderDetail } from '~/src/types/order-pick';

/**
 * Nguồn duy nhất cho order detail – cache theo orderCode.
 * Màn hình dùng useOrderDetailForCode(code) để fetch và sync vào đây;
 * component đọc qua useOrderDetailStore((s) => s.orderDetails[code]).
 */
interface OrderDetailState {
  orderDetails: Record<string, OrderDetail>;
  setOrderDetail: (orderCode: string, orderDetail: OrderDetail) => void;
  getOrderDetail: (orderCode: string) => OrderDetail | undefined;
  clearOrderDetail: (orderCode: string) => void;
  clearAll: () => void;
}

const _useOrderDetailStore = create<OrderDetailState>((set, get) => ({
  orderDetails: {},
  setOrderDetail: (orderCode: string, orderDetail: OrderDetail) => {
    set((state) => ({
      orderDetails: {
        ...state.orderDetails,
        [orderCode]: orderDetail,
      },
    }));
  },
  getOrderDetail: (orderCode: string) => get().orderDetails[orderCode],
  clearOrderDetail: (orderCode: string) => {
    set((state) => {
      const next = { ...state.orderDetails };
      delete next[orderCode];
      return { orderDetails: next };
    });
  },
  clearAll: () => set({ orderDetails: {} }),
}));

export const useOrderDetailStore = createSelectors(_useOrderDetailStore);

export const setOrderDetailForCode = (
  orderCode: string,
  orderDetail: OrderDetail,
) => _useOrderDetailStore.getState().setOrderDetail(orderCode, orderDetail);

export const getOrderDetailByCode = (
  orderCode: string,
): OrderDetail | undefined =>
  _useOrderDetailStore.getState().getOrderDetail(orderCode);

export const clearOrderDetailByCode = (orderCode: string) =>
  _useOrderDetailStore.getState().clearOrderDetail(orderCode);
