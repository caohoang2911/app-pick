import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { Product } from '~/src/types/product';

interface OrdersState {
  isScanQrCodeProduct: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  orderPickProducts:
    | {
        barcode?: {
          number?: number;
          picked?: boolean;
        };
      }
    | {};
  toggleScanQrCode: (status: boolean) => void;
  setSuccessForBarcodeScan: (barcode: string) => void;
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
  keyword: '',
  orderPickProducts: {},
  barcodeScanSuccess: '',
  toggleScanQrCode: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  setSuccessForBarcodeScan: (barcode: string) => {
    set({ barcodeScanSuccess: barcode });
  },
  setInitOrderPickProducts: (data: any) => {
    set({ orderPickProducts: { ...data } });
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

export const setSuccessForBarcodeScan = (barcode: string) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode);

export const setInitOrderPickProducts = (
  data: Array<{ [barcode: string]: number }>
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setOrderPickProducts = ({
  barcode,
  number,
}: {
  barcode: string;
  number: number;
}) => _useOrderPick.getState().setOrderPickProducts({ barcode, number });
