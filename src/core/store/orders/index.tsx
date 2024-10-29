import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderStatus } from '~/src/types/order';

interface OrdersState {
  isScanQrCode: boolean;
  selectedOrderCounter: OrderStatus;
  keyword: string;
  deliveryType: string;
  expectedDeliveryTimeRange: string;
  operationType: string;
  toggleScanQrCode: (status: boolean) => void;
  setSelectedOrderCounter: (status: OrderStatus) => void;
  setKeyWord: (keyword?: string) => void;
  setOperationType: (operationType: string | null) => void;
  setDeliveryType: (deliveryType: string) => void;
  setExpectedDeliveryTimeRange: (time: string) => void;
}

const _useOrders = create<OrdersState>((set, get) => ({
  isScanQrCode: false,
  selectedOrderCounter: 'ALL',
  keyword: '',
  deliveryType: 'ONLINE_DELIVERY',
  expectedDeliveryTimeRange: '',
  operationType: 'CAMPAIGN',
  toggleScanQrCode: (isScanQrCode: boolean) => {
    set({ isScanQrCode });
  },
  setSelectedOrderCounter: (selectedOrderCounter: OrderStatus) => {
    set({ selectedOrderCounter });
  },
  setKeyWord: (keyword?: string) => {
    set({ keyword });
  },
  setOperationType: (operationType?: string) => {
    set((state) => ({ ...state, operationType }));
  },
  setDeliveryType: (deliveryType: string) => {
    set((state) => ({ ...state, deliveryType }));
  },
  setExpectedDeliveryTimeRange: (expectedDeliveryTimeRange: string) => {
    set({ expectedDeliveryTimeRange });
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

export const setExpectedDeliveryTimeRange = (expectedDeliveryTimeRange: string) =>
  _useOrders.getState().setExpectedDeliveryTimeRange(expectedDeliveryTimeRange);

export const setOperationType = (operationType: string | null) =>
  _useOrders.getState().setOperationType(operationType);
