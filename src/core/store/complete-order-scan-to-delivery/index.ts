import { create } from 'zustand';
import { OrderBagItem } from '~/src/types/order-bag';
import { createSelectors } from '../../utils/browser';
import { OrderDetail } from '~/src/types/order-detail';


interface CompleteOrderScanToDeliveryState {
  orderBags: (OrderBagItem)[];
  uploadedImages: string[];
  orderDetail: OrderDetail;
  setCompleteOrderBags: (orderBags: (OrderBagItem)[]) => void;
  setCompleteUploadedImages: (uploadedImage: string, reset?: boolean) => void;
  setCompleteOrderDetail: (orderDetail: OrderDetail) => void;
}

const _useCompleteOrderScanToDelivery = create<CompleteOrderScanToDeliveryState>((set, get) => ({
  orderBags: [],
  uploadedImages: [],
  orderDetail: {},
  setCompleteOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
  setCompleteOrderBags: (orderBags: (OrderBagItem)[]) => {
    set(() => ({ 
      orderBags 
    }));
  },
  setCompleteUploadedImages: (uploadedImage: string, reset?: boolean) => {
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
}));

export const useCompleteOrderScanToDelivery = createSelectors(_useCompleteOrderScanToDelivery);

export const setCompleteOrderBags = (orderBags: (OrderBagItem)[]) => {
  _useCompleteOrderScanToDelivery.getState().setCompleteOrderBags(orderBags);
};

export const getCompleteUploadedImages = () => {
  return useCompleteOrderScanToDelivery((state) => state.uploadedImages);
};

export const setCompleteUploadedImages = (uploadedImage: string, reset?: boolean) => {
  _useCompleteOrderScanToDelivery.getState().setCompleteUploadedImages(uploadedImage, reset);
};

export const setCompleteOrderDetail = (orderDetail: OrderDetail) => {
  _useCompleteOrderScanToDelivery.getState().setCompleteOrderDetail(orderDetail);
};

