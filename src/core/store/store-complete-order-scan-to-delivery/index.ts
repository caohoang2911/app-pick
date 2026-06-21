import { create } from 'zustand';
import { OrderBagItem } from '~/src/types/order-bags';
import { createSelectors } from '../../utils/browser';
interface CompleteOrderScanToDeliveryState {
  orderBags: OrderBagItem[];
  uploadedImages: string[];
  setCompleteOrderBags: (orderBags: OrderBagItem[]) => void;
  setCompleteUploadedImages: (uploadedImage: string, reset?: boolean) => void;
}

const _useStoreCompleteOrderScanToDelivery =
  create<CompleteOrderScanToDeliveryState>((set, get) => ({
    orderBags: [],
    uploadedImages: [],
    setCompleteOrderBags: (orderBags: OrderBagItem[]) => {
      set(() => ({
        orderBags,
      }));
    },
    setCompleteUploadedImages: (uploadedImage: string, reset?: boolean) => {
      if (reset) {
        set(() => ({
          uploadedImages: [],
        }));
      } else {
        set((state) => ({
          uploadedImages: [...state.uploadedImages, uploadedImage],
        }));
      }
    },
  }));

export const useStoreCompleteOrderScanToDelivery = createSelectors(
  _useStoreCompleteOrderScanToDelivery,
);

export const setCompleteOrderBags = (orderBags: OrderBagItem[]) => {
  _useStoreCompleteOrderScanToDelivery
    .getState()
    .setCompleteOrderBags(orderBags);
};

export const getCompleteUploadedImages = () => {
  return useStoreCompleteOrderScanToDelivery((state) => state.uploadedImages);
};

export const setCompleteUploadedImages = (
  uploadedImage: string,
  reset?: boolean,
) => {
  _useStoreCompleteOrderScanToDelivery
    .getState()
    .setCompleteUploadedImages(uploadedImage, reset);
};
