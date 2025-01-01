import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { set } from 'lodash';
import { OrderBagItem } from '~/src/types/order-bag';
import { BarcodeScanningResult } from 'expo-camera';
import { useOrderInvoice } from '../order-invoice';


interface OrderScanToDeliveryState {
  isScanQrCodeProduct: boolean;
  orderBags: (OrderBagItem)[];
  toggleScanQrCodeProduct: (isScanQrCodeProduct: boolean) => void;
  setOrderBags: (orderBags: (OrderBagItem)[]) => void;
  scanQrCodeSuccess: (result: BarcodeScanningResult) => void;
}

const _useOrderScanToDelivery = create<OrderScanToDeliveryState>((set, get) => ({
  isScanQrCodeProduct: false,
  orderBags: [],
  toggleScanQrCodeProduct: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  setOrderBags: (orderBags: (OrderBagItem)[]) => {
    set({ orderBags });
  },
  scanQrCodeSuccess: (result: BarcodeScanningResult) => {
    const orderBags = get().orderBags;
    const orderBag = orderBags.find((bag) => bag.code === result.data);
    if (orderBag) {
      set({ orderBags: [...orderBags, {...orderBag, isDone: true}] });
    }
  }
}));

export const useOrderScanToDelivery = createSelectors(_useOrderScanToDelivery);

export const toggleScanQrCodeProduct   = (isScanQrCodeProduct: boolean) => {
  _useOrderScanToDelivery.getState().toggleScanQrCodeProduct(isScanQrCodeProduct);
};

export const setOrderBags = (orderBags: (OrderBagItem)[]) => {
  _useOrderScanToDelivery.getState().setOrderBags(orderBags);
};

export const scanQrCodeSuccess = (result: BarcodeScanningResult) => {
  _useOrderScanToDelivery.getState().scanQrCodeSuccess(result);
};

export const getIsScanQrCodeProduct = () => {
  return useOrderScanToDelivery((state) => state.isScanQrCodeProduct);
};
