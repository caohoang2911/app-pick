import { create } from 'zustand';
import { OrderDelivery, OrderDetail, OrderDetailHeader } from '~/src/types/order-detail';
import { Product, ProductItemGroup } from '~/src/types/product';
import { createSelectors } from '../../utils/browser';
import { barcodeCondition } from '../../utils/order-bag';

interface OrdersState {
  orderDetail: OrderDetail;
  isScanQrCodeProduct: boolean;
  isShowAmountInput: boolean;
  barcodeScanSuccess: string;
  keyword: string;
  barcodeScrollTo: string;
  fillInput: boolean;
  isShowConfirmationRemoveProductCombo: boolean;
  productComboRemoveSelected: Product | null;
  orderPickProducts: Array<Product | ProductItemGroup>;
  quantityFromBarcode: number;
  scannedIds: Record<string, boolean>;
  currentId: number | null;
  isEditManual: boolean;
  setIsEditManual: (isEditManual: boolean) => void;
  setKeyword: (keyword: string) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean, id?: number) => void;
  setSuccessForBarcodeScan: (barcode: string, { fillInput }: { fillInput?: boolean }) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: Array<Product | ProductItemGroup>) => void;
  setOrderPickProduct: (product: Product) => void;
  toggleConfirmationRemoveProductCombo: (isShowConfirmationRemoveProductCombo: boolean, product?: Product) => void;
  setQuantityFromBarcode: (quantity: number) => void;
  setCurrentId: (id: number | null) => void;
}

const _useOrderPick = create<OrdersState>((set, get) => ({
  orderDetail: {} as OrderDetail,
  isScanQrCodeProduct: false,
  isShowAmountInput: false,
  keyword: '',
  barcodeScrollTo: '',
  orderPickProducts: [],
  barcodeScanSuccess: '',
  fillInput: true,
  isShowConfirmationRemoveProductCombo: false,
  productComboRemoveSelected: null,
  quantityFromBarcode: 0,
  scannedIds: {},
  currentId: null,
  isEditManual: false,
  setIsEditManual: (isEditManual: boolean) => {
    set({ isEditManual });
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
  setSuccessForBarcodeScan: (barcode: string, { fillInput = true }: { fillInput?: boolean } = {}) => {
    set({ barcodeScanSuccess: barcode, fillInput });
  },
  setInitOrderPickProducts: (data: any) => {
    set({ orderPickProducts: [ ...data ] });
  },
  setBarcodeScrollTo: (barcode: string) => {
    set({ barcodeScrollTo: barcode });
  },
  toggleConfirmationRemoveProductCombo: (isShowConfirmationRemoveProductCombo: boolean, product?: Product) => {
    set({ isShowConfirmationRemoveProductCombo, productComboRemoveSelected: product });
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
    
    let flag = false;
    const newOrderPickProducts = orderPickProducts.map((productMap: Product | ProductItemGroup | any) => {
      return { ...productMap, elements: productMap.elements?.map((productRel: Product) => {
        const productAsTypeProduct = { ...productRel as Product };
        const isEditManual = get().isEditManual;

        if(isEditManual) {
          if(product.id === productAsTypeProduct.id) {
            flag = true;
            return { ...productAsTypeProduct, ...product };
          } else {
            return productAsTypeProduct;
          }
        } else {
          if(barcodeCondition(product.barcode, productAsTypeProduct.refBarcodes) && !flag) {
            flag = true;
            toggleShowAmountInput(false);
            return { ...productAsTypeProduct, ...product };
          } else {
            return productAsTypeProduct;
          }
        }
      })};
    });

    set({
      barcodeScrollTo: product.barcode,
      orderPickProducts: [...newOrderPickProducts],
    });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean) =>
  _useOrderPick.getState().toggleScanQrCode(status);

export const toggleShowAmountInput = (isShowAmountInput: boolean, id?: number) =>
  _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput, id);

export const setSuccessForBarcodeScan = (barcode: string, { fillInput = true }: { fillInput?: boolean } = {}) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode, { fillInput });

export const setInitOrderPickProducts = (
  data: Array<Product | ProductItemGroup>
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setBarcodeScrollTo = (barcode: string) =>  
  _useOrderPick.getState().setBarcodeScrollTo(barcode);

export const setKeyword = (keyword: string) =>
  _useOrderPick.getState().setKeyword(keyword);

export const setOrderPickProduct = (product: Product) => _useOrderPick.getState().setOrderPickProduct(product);

export const setOrderDetail = (orderDetail: OrderDetail) =>
  _useOrderPick.getState().setOrderDetail(orderDetail);

export const setCurrentId = (id: number | null) =>
  _useOrderPick.getState().setCurrentId(id);

export const setQuantityFromBarcode = (quantity: number) =>
  _useOrderPick.getState().setQuantityFromBarcode(quantity);

export const toggleConfirmationRemoveProductCombo = (isShowConfirmationRemoveProductCombo: boolean, product?: Product) =>
  _useOrderPick.getState().toggleConfirmationRemoveProductCombo(isShowConfirmationRemoveProductCombo, product);

export const getProductComboRemoveSelected = () =>
  _useOrderPick.getState().productComboRemoveSelected;

export const getQuantityFromBarcode = () =>
  _useOrderPick.getState().quantityFromBarcode;

export const getHeaderOrderDetailOrderPick = (): OrderDetailHeader | {} => _useOrderPick.getState().orderDetail?.header || {};

export const getDeliveryOrderDetailOrderPick = (): OrderDelivery | {} => _useOrderPick.getState().orderDetail?.delivery || {};

export const setIsEditManual = (isEditManual: boolean) =>
  _useOrderPick.getState().setIsEditManual(isEditManual);
