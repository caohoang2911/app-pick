import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderStatus } from '~/src/types/order';

interface OrdersState {
  isScanQrCode: boolean;
  selectedOrderCounter: OrderStatus;
  keyword: string;
  deliveryType: string;
  operationType: string;
  fromScanQrCode: boolean;
  toggleScanQrCode: (status: boolean) => void;
  setSelectedOrderCounter: (status: OrderStatus) => void;
  setKeyWord: (keyword?: string) => void;
  setFromScanQrCode: (fromScanQrCode: boolean) => void;
  setOperationType: (operationType: string | null) => void;
  setDeliveryType: (deliveryType: string) => void;
  reset: () => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  selectedOrderCounter: 'ALL',
  keyword: '',
  deliveryType: 'SHIPPER_DELIVERY',
  operationType: '',
  fromScanQrCode: false,
  toggleScanQrCode: (isScanQrCode: boolean) => {
    set({ isScanQrCode });
  },
  setSelectedOrderCounter: (selectedOrderCounter: OrderStatus) => {
    set({ selectedOrderCounter });
  },
  setFromScanQrCode: (fromScanQrCode: boolean) => {
    set({ fromScanQrCode });
  },
  setKeyWord: (keyword?: string) => {
    set({ keyword });
  },
  setOperationType: (operationType: string | any) => {
    set((state) => ({ ...state, operationType }));
  },
  setDeliveryType: (deliveryType: string) => {
    set((state) => ({ ...state, deliveryType }));
  },
  reset: () => {
    set({
      isScanQrCode: false,
      selectedOrderCounter: 'ALL',
      keyword: '',
      operationType: 'CAMPAIGN',
      deliveryType: 'SHIPPER_DELIVERY',
    });
  },
}));

export const useOrders = createSelectors(_useOrders);

export const toggleScanQrCode = (status: boolean) =>
  _useOrders.getState().toggleScanQrCode(status);

export const setSelectedOrderCounter = (status: OrderStatus) =>
  _useOrders.getState().setSelectedOrderCounter(status);

export const setKeyWord = (keyword?: string) =>
  _useOrders.getState().setKeyWord(keyword);

export const setDeliveryType = (deliveryType: string) =>
  _useOrders.getState().setDeliveryType(deliveryType);

export const setOperationType = (operationType: string | null) =>
  _useOrders.getState().setOperationType(operationType);

export const setFromScanQrCode = (fromScanQrCode: boolean) =>
  _useOrders.getState().setFromScanQrCode(fromScanQrCode);

export const reset = () => _useOrders.getState().reset();
