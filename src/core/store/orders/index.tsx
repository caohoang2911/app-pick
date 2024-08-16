import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';

interface OrdersState {
  isScanQrCode: boolean;
  selectedOrderCounter: OrderStatus;
  keyword: string;
  toggleScanQrCode: (status: boolean) => void;
  setSelectedOrderCounter: (status: OrderStatus) => void;
  setKeyWord: (keyword?: string) => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  selectedOrderCounter: 'ALL',
  keyword: '',
  toggleScanQrCode: (isScanQrCode: boolean) => {
    set({ isScanQrCode });
  },
  setSelectedOrderCounter: (selectedOrderCounter: OrderStatus) => {
    set({ selectedOrderCounter });
  },
  setKeyWord: (keyword?: string) => {
    set({ keyword });
  },
}));

export const useOrders = createSelectors(_useOrders);

export const toggleScanQrCode = (status: boolean) =>
  _useOrders.getState().toggleScanQrCode(status);

export const setSelectedOrderCounter = (status: OrderStatus) =>
  _useOrders.getState().setSelectedOrderCounter(status);

export const setKeyWord = (keyword?: string) =>
  _useOrders.getState().setKeyWord(keyword);
