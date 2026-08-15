import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
interface CompleteOrderScanToDeliveryState {
  uploadedImages: string[];
  setCompleteUploadedImages: (uploadedImage: string, reset?: boolean) => void;
}

const _useStoreCompleteOrderScanToDelivery =
  create<CompleteOrderScanToDeliveryState>((set) => ({
    uploadedImages: [],
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

export const setCompleteUploadedImages = (
  uploadedImage: string,
  reset?: boolean,
) => {
  _useStoreCompleteOrderScanToDelivery
    .getState()
    .setCompleteUploadedImages(uploadedImage, reset);
};
