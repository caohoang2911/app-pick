import { BarcodeScanningResult } from 'expo-camera';
import { showMessage } from 'react-native-flash-message';
import { create } from 'zustand';
import { OrderBagItem } from '~/src/types/order-bag';
import { createSelectors } from '../../utils/browser';
import { isValidOrderBagCode } from '../../utils/order-bag';


interface OrderScanToDeliveryState {
  isScanQrCodeProduct: boolean;
  orderBags: (OrderBagItem)[];
  uploadedImages: string[];
  toggleScanQrCodeProduct: (isScanQrCodeProduct: boolean) => void;
  setOrderBags: (orderBags: (OrderBagItem)[]) => void;
  scanQrCodeSuccess: (result: BarcodeScanningResult, cb?: (orderBags: (OrderBagItem)[]) => void) => void;
  setUploadedImages: (uploadedImage: string, reset?: boolean) => void;
}

const _useOrderScanToDelivery = create<OrderScanToDeliveryState>((set, get) => ({
  isScanQrCodeProduct: false,
  orderBags: [],
  uploadedImages: [],
  toggleScanQrCodeProduct: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  setOrderBags: (orderBags: (OrderBagItem)[]) => {
    set({ orderBags });
  },
  setUploadedImages: (uploadedImage: string, reset?: boolean) => {
    if(reset) {
      set(() => ({ 
        uploadedImages: [] 
      }));
    } else {
      set((state) => ({
        uploadedImages: [...state.uploadedImages, uploadedImage],
      }));
    }
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

export const useOrderScanToDelivery = createSelectors(_useOrderScanToDelivery);

export const toggleScanQrCodeProduct   = (isScanQrCodeProduct: boolean) => {
  _useOrderScanToDelivery.getState().toggleScanQrCodeProduct(isScanQrCodeProduct);
};

export const setOrderBags = (orderBags: (OrderBagItem)[]) => {
  _useOrderScanToDelivery.getState().setOrderBags(orderBags);
};

export const scanQrCodeSuccess = (result: BarcodeScanningResult, cb?: (orderBags: (OrderBagItem)[]) => void) => {
  _useOrderScanToDelivery.getState().scanQrCodeSuccess(result, cb);
};

export const getIsScanQrCodeProduct = () => {
  return useOrderScanToDelivery((state) => state.isScanQrCodeProduct);
};

export const getUploadedImages = () => {
  return useOrderScanToDelivery((state) => state.uploadedImages);
};

export const setUploadedImages = (uploadedImage: string, reset?: boolean) => {
  _useOrderScanToDelivery.getState().setUploadedImages(uploadedImage, reset);
};
