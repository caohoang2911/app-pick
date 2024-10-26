import { create } from 'zustand';
import { OrderDetail } from '~/src/types/order-detail';
import { createSelectors } from '../../utils/browser';

interface OrdersState {
  orderInvoice: OrderDetail;
  setOrderInvoice: (orderDetail: OrderDetail) => void;
}

const _useOrderInvoice = create<OrdersState>((set, get) => ({
  orderInvoice: {} as OrderDetail,
  setOrderInvoice: (orderInvoice: OrderDetail) => {
    set({ orderInvoice });
  },
}));

export const useOrderInvoice = createSelectors(_useOrderInvoice);

export const setOrderInvoice = (orderDetail: OrderDetail) =>
  _useOrderInvoice.getState().setOrderInvoice(orderDetail);
