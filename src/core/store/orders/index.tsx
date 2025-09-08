import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderStatus, OrderStatusDriver } from '~/src/types/order';

const TAB_STATUS_DEFAULT = 'CONFIRMED';

interface OrdersState {
  isScanQrCode: boolean;
  selectedOrderCounter: OrderStatus | OrderStatusDriver;
  keyword: string;
  deliveryType: string | null;
  fromScanQrCode: boolean;
  toggleScanQrCode: (status: boolean) => void;
  setSelectedOrderCounter: (status: OrderStatus | OrderStatusDriver | undefined) => void;
  setKeyWord: (keyword?: string) => void;
  setFromScanQrCode: (fromScanQrCode: boolean) => void;
  setDeliveryType: (deliveryType: string | null) => void;
  reset: () => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  selectedOrderCounter: TAB_STATUS_DEFAULT,
  keyword: '',
  deliveryType: null,
  fromScanQrCode: false,
  toggleScanQrCode: (isScanQrCode: boolean) => {
    set({ isScanQrCode });
  },
  setSelectedOrderCounter: (selectedOrderCounter: OrderStatus | OrderStatusDriver | undefined) => {
    set({ selectedOrderCounter });
  },
  setFromScanQrCode: (fromScanQrCode: boolean) => {
    set({ fromScanQrCode });
  },
  setKeyWord: (keyword?: string) => {
    set({ keyword });
  },
  setDeliveryType: (deliveryType: string | null) => {
    set((state) => ({ ...state, deliveryType }));
  },
  reset: () => {
    set({
      isScanQrCode: false,
      selectedOrderCounter: 'ALL',
      keyword: '',
      deliveryType: '',
    });
  },
}));

export const useOrders = createSelectors(_useOrders);

export const toggleScanQrCode = (status: boolean) =>
  _useOrders.getState().toggleScanQrCode(status);

export const setSelectedOrderCounter = (status: OrderStatus | OrderStatusDriver | undefined) =>
  _useOrders.getState().setSelectedOrderCounter(status);

export const setKeyWord = (keyword?: string) =>
  _useOrders.getState().setKeyWord(keyword);

export const setDeliveryType = (deliveryType: string | null) =>
  _useOrders.getState().setDeliveryType(deliveryType);



export const setFromScanQrCode = (fromScanQrCode: boolean) =>
  _useOrders.getState().setFromScanQrCode(fromScanQrCode);

export const reset = () => _useOrders.getState().reset();
