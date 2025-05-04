import { BarcodeScanningResult } from 'expo-camera';
import { showMessage } from 'react-native-flash-message';
import { create } from 'zustand';
import { OrderBagItem } from '~/src/types/order-bag';
import { createSelectors } from '../../utils/browser';
import { isValidOrderBagCode } from '../../utils/order-bag';
import { OrderDetail } from '~/src/types/order-detail';

interface StoreStartOrderScanToDeliveryState {
  isScanQrCodeProduct: boolean;
  orderDetail: OrderDetail;
  orderBags: (OrderBagItem)[];
  setStoreStartOrderDetail: (orderDetail: OrderDetail) => void; 
  toggleStoreStartScanQrCodeProduct: (isScanQrCodeProduct: boolean) => void;
  setStoreStartOrderBags: (orderBags: (OrderBagItem)[]) => void;
  scanQrCodeSuccess: (result: BarcodeScanningResult, cb?: (orderBags: (OrderBagItem)[]) => void) => void;
}

const _useStoreStartOrderScanToDelivery = create<StoreStartOrderScanToDeliveryState>((set, get) => ({
  isScanQrCodeProduct: false,
  orderDetail: {},
  orderBags: [],
  setStoreStartOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
  toggleStoreStartScanQrCodeProduct: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  setStoreStartOrderBags: (orderBags: (OrderBagItem)[]) => {
    set({ orderBags });
  },
  scanQrCodeSuccess: (result: BarcodeScanningResult, cb?: (orderBags: (OrderBagItem)[]) => void) => {
    const orderBags = get().orderBags;
    const orderBagIndex = orderBags.findIndex((bag) => bag.code === result.data);

    if (orderBagIndex !== -1) { 
      const newOrderBags = [...orderBags];
      newOrderBags[orderBagIndex].isDone = true;
      set({ orderBags: newOrderBags });
      setTimeout(() => {
        cb?.(orderBags);
      }, 500);
    } else {
      if (!isValidOrderBagCode(result.data)) {
        showMessage({
          message: `${result.data} không đúng định dạng túi hàng`,
          type: 'danger',
        });
        return;
      }
      showMessage({
        message: `Không tìm thấy túi hàng ${result.data}`,
        type: 'danger',
      });
    }
  }
}));

export const useStoreStartOrderScanToDelivery = createSelectors(_useStoreStartOrderScanToDelivery);

export const toggleStoreStartScanQrCodeProduct = (isScanQrCodeProduct: boolean) => {
  _useStoreStartOrderScanToDelivery.getState().toggleStoreStartScanQrCodeProduct(isScanQrCodeProduct);
};

export const setStoreStartOrderBags = (orderBags: (OrderBagItem)[]) => {
  _useStoreStartOrderScanToDelivery.getState().setStoreStartOrderBags(orderBags);
};

export const scanQrCodeSuccess = (result: BarcodeScanningResult, cb?: (orderBags: (OrderBagItem)[]) => void) => {
  _useStoreStartOrderScanToDelivery.getState().scanQrCodeSuccess(result, cb);
};

export const setStoreStartOrderDetail = (orderDetail: OrderDetail) => {
  _useStoreStartOrderScanToDelivery.getState().setStoreStartOrderDetail(orderDetail);
};

export const getIsScanQrCodeProduct = () => {
  return useStoreStartOrderScanToDelivery((state) => state.isScanQrCodeProduct);
};
