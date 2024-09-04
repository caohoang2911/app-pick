import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderDetail } from '~/src/types/order-detail';
import { Product } from '~/src/types/product';
import moment from 'moment';

interface OrdersState {
  orderDetail: OrderDetail;
  isScanQrCodeProduct: boolean;
  isShowAmountInput: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  barcodeScrollTo: string;
  orderPickProducts:
    | {
        barcode?: Product;
      }
    | {};
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean) => void;
  setSuccessForBarcodeScan: (barcode: string) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: any) => void;
  setOrderPickProducts: ({
    barcode,
    pickedQuantity,
    pickedError,
    pickedNote,
  }: {
    barcode: string;
    pickedQuantity: number;
    pickedError: string;
    pickedNote: string;
  }) => void;
}

const _useOrderPick = create<OrdersState>((set, get) => ({
  orderDetail: {} as OrderDetail,
  isScanQrCodeProduct: false,
  isShowAmountInput: false,
  keyword: '',
  barcodeScrollTo: '',
  orderPickProducts: {},
  barcodeScanSuccess: '',
  setOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
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
  setBarcodeScrollTo: (barcode: string) => {
    set({ barcodeScrollTo: barcode });
  },
  setOrderPickProducts: ({
    barcode,
    pickedQuantity,
    pickedError,
    pickedNote,
    ...rests
  }: {
    barcode: string;
    pickedQuantity: number;
    pickedError: string;
    pickedNote: string;
  }) => {
    const orderPickProducts = get().orderPickProducts;

    if (!(barcode in orderPickProducts)) {
      return;
    }
    set({
      barcodeScrollTo: barcode,
      orderPickProducts: {
        ...orderPickProducts,
        [barcode]: { pickedQuantity, pickedTime: moment().valueOf(), pickedError, pickedNote, barcode, ...rests },
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
  pickedQuantity,
  pickedError,
  pickedNote,
  ...rests
}: {
  barcode: string;
  pickedQuantity: number;
  pickedError: string;
  pickedNote: string;
}) => _useOrderPick.getState().setOrderPickProducts({ barcode, pickedQuantity, pickedError,
  pickedNote, ...rests });

export const setOrderDetail = (orderDetail: OrderDetail) =>
  _useOrderPick.getState().setOrderDetail(orderDetail);
