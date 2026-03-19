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
  loadingByCode: Record<string, boolean>;
  setOrderDetail: (orderCode: string, orderDetail: OrderDetail) => void;
  setLoadingByCode: (orderCode: string, isLoading: boolean) => void;
  getLoadingByCode: (orderCode: string) => boolean;
  getOrderDetail: (orderCode: string) => OrderDetail | undefined;
  clearOrderDetail: (orderCode: string) => void;
  clearAll: () => void;
}

const _useOrderDetailStore = create<OrderDetailState>((set, get) => ({
  orderDetails: {},
  loadingByCode: {},
  setOrderDetail: (orderCode: string, orderDetail: OrderDetail) => {
    set((state) => ({
      orderDetails: {
        ...state.orderDetails,
        [orderCode]: orderDetail,
      },
    }));
  },
  setLoadingByCode: (orderCode: string, isLoading: boolean) => {
    set((state) => ({
      loadingByCode: {
        ...state.loadingByCode,
        [orderCode]: isLoading,
      },
    }));
  },
  getLoadingByCode: (orderCode: string) => !!get().loadingByCode[orderCode],
  getOrderDetail: (orderCode: string) => get().orderDetails[orderCode],
  clearOrderDetail: (orderCode: string) => {
    set((state) => {
      const next = { ...state.orderDetails };
      const nextLoading = { ...state.loadingByCode };
      delete next[orderCode];
      delete nextLoading[orderCode];
      return { orderDetails: next, loadingByCode: nextLoading };
    });
  },
  clearAll: () => set({ orderDetails: {}, loadingByCode: {} }),
}));

export const useOrderDetailStore = createSelectors(_useOrderDetailStore);

export const setOrderDetailForCode = (
  orderCode: string,
  orderDetail: OrderDetail,
) => _useOrderDetailStore.getState().setOrderDetail(orderCode, orderDetail);

export const setOrderDetailLoadingByCode = (
  orderCode: string,
  isLoading: boolean,
) => _useOrderDetailStore.getState().setLoadingByCode(orderCode, isLoading);

export const getOrderDetailByCode = (
  orderCode: string,
): OrderDetail | undefined =>
  _useOrderDetailStore.getState().getOrderDetail(orderCode);

export const clearOrderDetailByCode = (orderCode: string) =>
  _useOrderDetailStore.getState().clearOrderDetail(orderCode);
