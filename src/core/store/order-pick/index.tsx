import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { Product } from '~/src/types/product';

interface OrdersState {
  isScanQrCodeProduct: boolean;
  isShowAmountInput: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  barcodeScrollTo: string;
  orderPickProducts:
    | {
        barcode?: {
          number?: number;
          picked?: boolean;
        };
      }
    | {};
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean) => void;
  setSuccessForBarcodeScan: (barcode: string) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: any) => void;
  setOrderPickProducts: ({
    barcode,
    number,
  }: {
    barcode: string;
    number: number;
  }) => void;
}

const _useOrderPick = create<OrdersState>((set, get) => ({
  isScanQrCodeProduct: false,
  isShowAmountInput: false,
  keyword: '',
  barcodeScrollTo: '',
  orderPickProducts: {},
  barcodeScanSuccess: '',
  toggleScanQrCode: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  toggleShowAmountInput: (isShowAmountInput: boolean) => {
    set({ isShowAmountInput });
  },
  setSuccessForBarcodeScan: (barcode: string) => {
    set({ barcodeScanSuccess: barcode });
  },
  setInitOrderPickProducts: (data: any) => {
    set({ orderPickProducts: { ...data } });
  },
  setBarcodeScrollTo: (data: any) => {
    set({ barcodeScrollTo: { ...data } });
  },

  setOrderPickProducts: ({
    barcode,
    number,
  }: {
    barcode: string;
    number: number;
  }) => {
    const orderPickProducts = get().orderPickProducts;

    if (!(barcode in orderPickProducts)) {
      return;
    }
    set({
      barcodeScrollTo: barcode,
      orderPickProducts: {
        ...orderPickProducts,
        [barcode]: { number, picked: true },
      },
    });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean) =>
  _useOrderPick.getState().toggleScanQrCode(status);

export const toggleShowAmountInput = (isShowAmountInput: boolean) =>
  _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput);

export const setSuccessForBarcodeScan = (barcode: string) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode);

export const setInitOrderPickProducts = (
  data: Array<{ [barcode: string]: number }>
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setBarcodeScrollTo = (barcode: string) =>
  _useOrderPick.getState().setBarcodeScrollTo(barcode);

export const setOrderPickProducts = ({
  barcode,
  number,
}: {
  barcode: string;
  number: number;
}) => _useOrderPick.getState().setOrderPickProducts({ barcode, number });
