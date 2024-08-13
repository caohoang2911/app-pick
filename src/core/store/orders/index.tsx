import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';

interface OrdersState {
  isScanQrCode: boolean;
  toggleScanQrCode: (status: boolean) => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  toggleScanQrCode: (status) => {
    set({ isScanQrCode: status });
  },
}));

export const useOrders = createSelectors(_useOrders);

export const toggleScanQrCode = (status: boolean) =>
  _useOrders.getState().toggleScanQrCode(status);
