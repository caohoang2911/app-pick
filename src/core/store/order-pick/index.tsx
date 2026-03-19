import { create } from 'zustand';
import {
  OrderDelivery,
  OrderDetail,
  OrderDetailHeader,
} from '~/src/types/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import { ProductAction } from '@/core/constants/product';
import { createSelectors } from '../../utils/browser';

interface OrdersState {
  orderDetail: OrderDetail;
  currentCode: string | null;
  isScanQrCodeProduct: boolean;
  isShowAmountInput: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  barcodeScrollTo: string;
  lastScannedId: number | null;
  orderPickProducts: Array<Product | ProductItemGroup>;
  quantityFromBarcode: number;
  scannedIds: Record<string, boolean>;
  currentId: number | null;
  isEditManual: boolean;
  isScanMoreProduct: boolean;
  action: ProductAction | null;
  setAction: (action: ProductAction | null) => void;
  setScanMoreProduct: (isScanMoreProduct: boolean) => void;
  setIsEditManual: (isEditManual: boolean, action?: ProductAction) => void;
  setKeyword: (keyword: string) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean, id?: number) => void;
  setSuccessForBarcodeScan: (barcode: string) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setLastScannedId: (id: number | null) => void;
  setInitOrderPickProducts: (data: Array<Product | ProductItemGroup>) => void;
  setOrderPickProduct: (product: Product) => void;
  setQuantityFromBarcode: (quantity: number) => void;
  setCurrentId: (id: number | null) => void;
  setReplacePickedProductId: (id: number) => void;
  setIsVisibleReplaceProduct: (isVisibleReplaceProduct: boolean) => void;
  replacePickedProductId: number | null;
  isVisibleReplaceProduct: boolean;
  resetOrderPick: () => void;
  setCurrentCode: (code: string) => void;
}

const _useOrderPick = create<OrdersState>((set, get) => ({
  orderDetail: {} as OrderDetail,
  currentCode: null,
  isScanQrCodeProduct: false,
  isShowAmountInput: false,
  keyword: '',
  barcodeScrollTo: '',
  orderPickProducts: [],
  barcodeScanSuccess: '',
  lastScannedId: null,
  quantityFromBarcode: 0,
  scannedIds: {},
  currentId: null,
  isEditManual: false,
  isScanMoreProduct: false,
  action: null,
  replacePickedProductId: null,
  isVisibleReplaceProduct: false,
  resetOrderPick: () => {
    set({
      orderDetail: {} as OrderDetail,
      isScanQrCodeProduct: false,
      isShowAmountInput: false,
      keyword: '',
      barcodeScrollTo: '',
      orderPickProducts: [],
      barcodeScanSuccess: '',
      lastScannedId: null,
      quantityFromBarcode: 0,
      scannedIds: {},
      currentId: null,
      isEditManual: false,
      isScanMoreProduct: false,
      action: null,
      replacePickedProductId: null,
      isVisibleReplaceProduct: false,
    });
  },
  setCurrentCode: (code: string) => {
    set({ currentCode: code });
  },
  setScanMoreProduct: (isScanMoreProduct: boolean) => {
    set({ isScanMoreProduct });
  },
  setAction: (action: ProductAction | null) => {
    set({ action });
  },
  setIsEditManual: (isEditManual: boolean, action?: ProductAction) => {
    set({ isEditManual, action });
  },
  setKeyword: (keyword: string) => {
    set({ keyword });
  },
  setOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
  toggleScanQrCode: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  toggleShowAmountInput: (isShowAmountInput: boolean, id?: number) => {
    set({
      isShowAmountInput,
      scannedIds: id
        ? { ...get().scannedIds, [id]: true }
        : { ...get().scannedIds },
    });
  },
  setSuccessForBarcodeScan: (barcode: string) => {
    set({ barcodeScanSuccess: barcode });
  },
  setLastScannedId: (id: number | null) => {
    set({ lastScannedId: id });
  },
  setInitOrderPickProducts: (data: any) => {
    set({ orderPickProducts: [...data] });
  },
  setBarcodeScrollTo: (barcode: string) => {
    set({ barcodeScrollTo: barcode });
  },
  setQuantityFromBarcode: (quantity: number) => {
    set({ quantityFromBarcode: quantity });
  },
  setCurrentId: (id: number | null) => {
    set({ currentId: id });
  },
  setOrderPickProduct: (product: Product) => {
    const orderPickProducts = get().orderPickProducts;
    // TODO: update product picked

    const newOrderPickProducts = orderPickProducts.map(
      (productMap: Product | ProductItemGroup | any) => {
        return {
          ...productMap,
          elements: productMap.elements?.map((productRel: Product) => {
            const productAsTypeProduct = { ...(productRel as Product) };
            if (product.id === productAsTypeProduct.id) {
              return { ...productAsTypeProduct, ...product };
            } else {
              return productAsTypeProduct;
            }
          }),
        };
      },
    );

    set({
      barcodeScrollTo: product.barcode,
      orderPickProducts: [...newOrderPickProducts],
    });
  },
  setReplacePickedProductId: (id: number) => {
    set({ replacePickedProductId: id });
  },
  setIsVisibleReplaceProduct: (isVisibleReplaceProduct: boolean) => {
    set({ isVisibleReplaceProduct });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean) =>
  _useOrderPick.getState().toggleScanQrCode(status);

export const resetOrderPick = () => _useOrderPick.getState().resetOrderPick();

export const setCurrentCode = (code: string) =>
  _useOrderPick.getState().setCurrentCode(code);

export const toggleShowAmountInput = (
  isShowAmountInput: boolean,
  id?: number,
) => _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput, id);

export const setSuccessForBarcodeScan = (barcode: string) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode);

export const setInitOrderPickProducts = (
  data: Array<Product | ProductItemGroup>,
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setBarcodeScrollTo = (barcode: string) =>
  _useOrderPick.getState().setBarcodeScrollTo(barcode);

export const setLastScannedId = (id: number | null) =>
  _useOrderPick.getState().setLastScannedId(id);

export const setKeyword = (keyword: string) =>
  _useOrderPick.getState().setKeyword(keyword);

export const setOrderPickProduct = (product: Product) =>
  _useOrderPick.getState().setOrderPickProduct(product);

export const setOrderDetail = (orderDetail: OrderDetail) =>
  _useOrderPick.getState().setOrderDetail(orderDetail);

export const setCurrentId = (id: number | null) =>
  _useOrderPick.getState().setCurrentId(id);

export const setQuantityFromBarcode = (quantity: number) =>
  _useOrderPick.getState().setQuantityFromBarcode(quantity);

export const setIsEditManual = (
  isEditManual: boolean,
  action?: ProductAction,
) => _useOrderPick.getState().setIsEditManual(isEditManual, action);

export const setActionProduct = (action: ProductAction | null) =>
  _useOrderPick.getState().setAction(action);

export const setScanMoreProduct = (isScanMoreProduct: boolean) =>
  _useOrderPick.getState().setScanMoreProduct(isScanMoreProduct);

export const setIsVisibleReplaceProduct = (isVisibleReplaceProduct: boolean) =>
  _useOrderPick.getState().setIsVisibleReplaceProduct(isVisibleReplaceProduct);

export const setReplacePickedProductId = (id: number) =>
  _useOrderPick.getState().setReplacePickedProductId(id);
