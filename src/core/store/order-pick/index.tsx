import { create } from 'zustand';
import { OrderDelivery, OrderDetail, OrderDetailHeader } from '~/src/types/order-pick';
import { OrderItem, OrderItemGroup } from '~/src/types/product';
import { createSelectors } from '../../utils/browser';

interface OrdersState {
  orderDetail: OrderDetail;
  isScanQrCodeProduct: boolean;
  isShowAmountInput: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  barcodeScrollTo: string;
  orderPickProducts: Array<OrderItem | OrderItemGroup>;
  quantityFromBarcode: number;
  scannedIds: Record<string, boolean>;
  currentId: number | null;
  isEditManual: boolean;
  isScanMoreProduct: boolean;
  action: 'out-of-stock' | 'low-quality' | 'near-date' | 'incorrect-stock' | null;
  setAction: (action: 'out-of-stock' | 'low-quality' | 'near-date' | 'incorrect-stock' | null) => void;
  setScanMoreProduct: (isScanMoreProduct: boolean) => void;
  setIsEditManual: (isEditManual: boolean, action?: 'out-of-stock' | 'low-quality' | 'near-date') => void;
  setKeyword: (keyword: string) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean, id?: number) => void;
  setSuccessForBarcodeScan: (barcode: string) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: Array<OrderItem | OrderItemGroup>) => void;
  setOrderPickProduct: (product: OrderItem) => void;
  setQuantityFromBarcode: (quantity: number) => void;
  setCurrentId: (id: number | null) => void;
  setReplacePickedProductId: (id: number) => void;
  setIsVisibleReplaceProduct: (isVisibleReplaceProduct: boolean) => void; 
  replacePickedProductId: number | null;
  isVisibleReplaceProduct: boolean;
}

const _useOrderPick = create<OrdersState>((set, get) => ({
  orderDetail: {} as OrderDetail,
  isScanQrCodeProduct: false,
  isShowAmountInput: false,
  keyword: '',
  barcodeScrollTo: '',
  orderPickProducts: [],
  barcodeScanSuccess: '',
  quantityFromBarcode: 0,
  scannedIds: {},
  currentId: null,
  isEditManual: false,
  isScanMoreProduct: false,
  action: null,
  replacePickedProductId: null,
  isVisibleReplaceProduct: false,
  setScanMoreProduct: (isScanMoreProduct: boolean) => {
    set({ isScanMoreProduct });
  },
  setAction: (action: 'out-of-stock' | 'low-quality' | 'near-date' | 'incorrect-stock' | null) => {
    set({ action });
  },
  setIsEditManual: (isEditManual: boolean, action?: 'out-of-stock' | 'low-quality' | 'near-date') => {
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
    set({ isShowAmountInput, scannedIds: id ? { ...get().scannedIds, [id]: true } : {...get().scannedIds} });
  },
  setSuccessForBarcodeScan: (barcode: string) => {
    set({ barcodeScanSuccess: barcode });
  },
  setInitOrderPickProducts: (data: any) => {
    set({ orderPickProducts: [ ...data ] });
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
  setOrderPickProduct: (product: OrderItem) => {
    const orderPickProducts = get().orderPickProducts;
    // TODO: update product picked
    
    const newOrderPickProducts = orderPickProducts.map((productMap: OrderItem | OrderItemGroup | any) => {
      return { ...productMap, elements: productMap.elements?.map((productRel: OrderItem) => {
        const productAsTypeProduct = { ...productRel as OrderItem };
        if(product.id === productAsTypeProduct.id) {
          return { ...productAsTypeProduct, ...product };
        } else {
          return productAsTypeProduct;
        }
      })};
    });

    set({
      barcodeScrollTo: product.barcode,
      orderPickProducts: [...newOrderPickProducts],
    });
  },
  setReplacePickedProductId: (id: number) => {
    set({ replacePickedProductId: id});
  },
  setIsVisibleReplaceProduct: (isVisibleReplaceProduct: boolean) => {
    set({ isVisibleReplaceProduct });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean) =>
  _useOrderPick.getState().toggleScanQrCode(status);

export const toggleShowAmountInput = (isShowAmountInput: boolean, id?: number) =>
  _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput, id);

export const setSuccessForBarcodeScan = (barcode: string) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode);

export const setInitOrderPickProducts = (
  data: Array<OrderItem | OrderItemGroup>
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setBarcodeScrollTo = (barcode: string) =>  
  _useOrderPick.getState().setBarcodeScrollTo(barcode);

export const setKeyword = (keyword: string) =>
  _useOrderPick.getState().setKeyword(keyword);

export const setOrderPickProduct = (product: OrderItem) => _useOrderPick.getState().setOrderPickProduct(product);

export const setOrderDetail = (orderDetail: OrderDetail) =>
  _useOrderPick.getState().setOrderDetail(orderDetail);

export const setCurrentId = (id: number | null) =>
  _useOrderPick.getState().setCurrentId(id);

export const setQuantityFromBarcode = (quantity: number) =>
  _useOrderPick.getState().setQuantityFromBarcode(quantity);


export const setIsEditManual = (isEditManual: boolean, action?: 'out-of-stock' | 'low-quality' | 'near-date') =>
  _useOrderPick.getState().setIsEditManual(isEditManual, action);

export const setActionProduct = (action: 'out-of-stock' | 'low-quality' | 'near-date' | 'incorrect-stock' | null) =>
  _useOrderPick.getState().setAction(action);

export const setScanMoreProduct = (isScanMoreProduct: boolean) =>
  _useOrderPick.getState().setScanMoreProduct(isScanMoreProduct);

export const setIsVisibleReplaceProduct = (isVisibleReplaceProduct: boolean) =>
  _useOrderPick.getState().setIsVisibleReplaceProduct(isVisibleReplaceProduct);

export const setReplacePickedProductId = (id: number) =>
  _useOrderPick.getState().setReplacePickedProductId(id);
