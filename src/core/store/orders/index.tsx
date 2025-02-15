import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderStatus } from '~/src/types/order';

const TAB_STATUS_DEFAULT = 'CONFIRMED';
const OPERATION_TYPE_DEFAULT = 'EXPRESS';

interface OrdersState {
  isScanQrCode: boolean;
  selectedOrderCounter: OrderStatus;
  keyword: string;
  deliveryType: string | null;
  operationType: string;
  fromScanQrCode: boolean;
  toggleScanQrCode: (status: boolean) => void;
  setSelectedOrderCounter: (status: OrderStatus) => void;
  setKeyWord: (keyword?: string) => void;
  setFromScanQrCode: (fromScanQrCode: boolean) => void;
  setOperationType: (operationType: string | null) => void;
  setDeliveryType: (deliveryType: string | null) => void;
  reset: () => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  selectedOrderCounter: TAB_STATUS_DEFAULT,
  keyword: '',
  deliveryType: null,
  operationType: OPERATION_TYPE_DEFAULT,
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
  setDeliveryType: (deliveryType: string | null) => {
    set((state) => ({ ...state, deliveryType }));
  },
  reset: () => {
    set({
      isScanQrCode: false,
      selectedOrderCounter: 'ALL',
      keyword: '',
      operationType: OPERATION_TYPE_DEFAULT,
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

export const setDeliveryType = (deliveryType: string | null) =>
  _useOrders.getState().setDeliveryType(deliveryType);

export const setOperationType = (operationType: string | null) =>
  _useOrders.getState().setOperationType(operationType);

export const setFromScanQrCode = (fromScanQrCode: boolean) =>
  _useOrders.getState().setFromScanQrCode(fromScanQrCode);

export const reset = () => _useOrders.getState().reset();
