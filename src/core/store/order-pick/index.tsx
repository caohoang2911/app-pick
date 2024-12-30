import moment from 'moment';
import { create } from 'zustand';
import { OrderDetail, OrderDetailHeader } from '~/src/types/order-detail';
import { Product } from '~/src/types/product';
import { createSelectors } from '../../utils/browser';

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
  orderPickProducts: Array<Array<Product>>;
  setKeyword: (keyword: string) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean) => void;
  setSuccessForBarcodeScan: (barcode: string, { fillInput }: { fillInput?: boolean }) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: Array<Array<Product>>) => void;
  setOrderPickProducts: (product: Product) => void;
  toggleConfirmationRemoveProductCombo: (isShowConfirmationRemoveProductCombo: boolean, product?: Product) => void;
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
  setKeyword: (keyword: string) => {
    set({ keyword });
  },
  setOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
  toggleScanQrCode: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  toggleShowAmountInput: (isShowAmountInput: boolean) => {
    set({ isShowAmountInput });
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
  setOrderPickProducts: (product: Product) => {
    const orderPickProducts = get().orderPickProducts;
    // TODO: update product picked
    const newOrderPickProducts = orderPickProducts.map((products: Array<Product>) => {
      return products.map((productRel: Product) => {
        if (productRel.barcode === product.barcode) {
          return { ...productRel, 
            pickedQuantity: (productRel.pickedQuantity || 0) + (product.pickedQuantity || 0), 
            pickedTime: moment().valueOf() 
          };
        }

        return productRel;
      });
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

export const toggleShowAmountInput = (isShowAmountInput: boolean) =>
  _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput);

export const setSuccessForBarcodeScan = (barcode: string, { fillInput = true }: { fillInput?: boolean } = {}) =>
  _useOrderPick.getState().setSuccessForBarcodeScan(barcode, { fillInput });

export const setInitOrderPickProducts = (
  data: Array<Array<Product>>
) => _useOrderPick.getState().setInitOrderPickProducts(data);

export const setBarcodeScrollTo = (barcode: string) =>  
  _useOrderPick.getState().setBarcodeScrollTo(barcode);

export const setKeyword = (keyword: string) =>
  _useOrderPick.getState().setKeyword(keyword);

export const setOrderPickProducts = (product: Product) => _useOrderPick.getState().setOrderPickProducts(product);

export const setOrderDetail = (orderDetail: OrderDetail) =>
  _useOrderPick.getState().setOrderDetail(orderDetail);

export const toggleConfirmationRemoveProductCombo = (isShowConfirmationRemoveProductCombo: boolean, product?: Product) =>
  _useOrderPick.getState().toggleConfirmationRemoveProductCombo(isShowConfirmationRemoveProductCombo, product);

export const getProductComboRemoveSelected = () =>
  _useOrderPick.getState().productComboRemoveSelected;

export const getOrderPickProductsFlat = () =>
  _useOrderPick.getState().orderPickProducts.flat();

export const getCurrentProductPicked = (barcode: string) =>
  getOrderPickProductsFlat()?.find((product: Product) => product.barcode === barcode); 

export const getHeaderOrderDetailOrderPick = (): OrderDetailHeader | {} => _useOrderPick.getState().orderDetail?.header || {};
