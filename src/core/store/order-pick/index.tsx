import moment from 'moment';
import { create } from 'zustand';
import { OrderDelivery, OrderDetail, OrderDetailHeader } from '~/src/types/order-detail';
import { Product, ProductItemGroup } from '~/src/types/product';
import { createSelectors } from '../../utils/browser';
import { hideAlert, showAlert } from '../alert-dialog';

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
  isNewScan: boolean;
  currentPid: number | null;
  setKeyword: (keyword: string) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  toggleScanQrCode: (status: boolean, { isNewScan }: { isNewScan?: boolean }) => void;
  toggleShowAmountInput: (isShowAmountInput: boolean) => void;
  setSuccessForBarcodeScan: (barcode: string, { fillInput }: { fillInput?: boolean }) => void;
  setBarcodeScrollTo: (barcode: string) => void;
  setInitOrderPickProducts: (data: Array<Product | ProductItemGroup>) => void;
  setOrderPickProduct: (product: Product) => void;
  toggleConfirmationRemoveProductCombo: (isShowConfirmationRemoveProductCombo: boolean, product?: Product) => void;
  setQuantityFromBarcode: (quantity: number) => void;
  setCurrentPid: (pid: number | null) => void;
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
  isNewScan: true,
  currentPid: null,
  setKeyword: (keyword: string) => {
    set({ keyword });
  },
  setOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail });
  },
  toggleScanQrCode: (isScanQrCodeProduct: boolean, { isNewScan }: { isNewScan?: boolean } = {}) => {
    set({ isScanQrCodeProduct, isNewScan });
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
  setQuantityFromBarcode: (quantity: number) => {
    set({ quantityFromBarcode: quantity });
  },
  setCurrentPid: (pid: number | null) => {
    set({ currentPid: pid });
  },
  setOrderPickProduct: (product: Product) => {
    const orderPickProducts = get().orderPickProducts;
    // TODO: update product picked
    
    let flag = false;
    const newOrderPickProducts = orderPickProducts.map((productMap: Product | ProductItemGroup) => {
      if(productMap.type === 'COMBO' && 'elements' in productMap) {
        return { ...productMap, elements: productMap.elements?.map((productRel: Product) => {
          if ((productRel.barcode === product.barcode || productRel.baseBarcode === product.barcode) && !flag && !productRel.pickedTime) {
            flag = true;
            const pickedQuantity = product.pickedQuantity || 0;
            return { ...productRel, ...product, pickedQuantity };
          } else {
            return productRel;
          }
        })};
      } else if(productMap.type === 'GIFT_PACK' && 'elements' in productMap) {
        return { ...productMap, elements: productMap.elements?.map((productRel: Product) => {
          if ((productRel.barcode === product.barcode || productRel.baseBarcode === product.barcode) && !flag && !productRel.pickedTime) {
            flag = true;
            const pickedQuantity = product.pickedQuantity || 0;
            return { ...productRel, ...product, pickedQuantity };
          } else {
            return productRel;
          }
        })};
      } else {
        if((productMap as Product).barcode === product.barcode || (productMap as Product).baseBarcode === product.barcode) {
          toggleShowAmountInput(false);
          return { ...productMap, ...product };
        }
        return productMap;
      }
    });

    set({
      barcodeScrollTo: product.barcode,
      orderPickProducts: [...newOrderPickProducts],
    });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean, {
  isNewScan = true
}: {
  isNewScan?: boolean
} = {}) =>
  _useOrderPick.getState().toggleScanQrCode(status, { isNewScan });

export const toggleShowAmountInput = (isShowAmountInput: boolean) =>
  _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput);

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

export const setCurrentPid = (pid: number | null) =>
  _useOrderPick.getState().setCurrentPid(pid);

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