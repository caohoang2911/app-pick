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
    console.log(data, "myData");
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
  setOrderPickProduct: (product: Product) => {
    const orderPickProducts = get().orderPickProducts;
    // TODO: update product picked
    
    const newOrderPickProducts = orderPickProducts.map((productMap: Product | ProductItemGroup) => {
      if(productMap.type === 'COMBO' && 'elements' in productMap) {
        let lowQuantity = false;
        return { ...productMap, elements: productMap.elements?.map((productRel: Product) => {
          if (productRel.barcode === product.barcode || productRel.baseBarcode === product.barcode) {
            const { elementPerComboQuantities, quantity: comboQuantity } = productMap || {};
            const productInComboAmountByBarcode = elementPerComboQuantities?.[product.barcode?.toString() || ''] || 0;
            const pickedQuantity = product.pickedQuantity || 0;

            let comboAvailable = comboQuantity;

            if(pickedQuantity && comboQuantity > 0) {
              comboAvailable = Math.floor(pickedQuantity / comboQuantity);
            }
            
            if(comboAvailable < comboQuantity) {
              showAlert({
                title: 'SP chưa đáp ứng đủ combo!',
                message: `SP chỉ đáp ứng đủ ${comboQuantity - comboAvailable} combo. Sản phẩm trong combo sẽ bị xoá, bạn có muốn tiếp tục?`,
                onConfirm: () => {
                  toggleShowAmountInput(false);
                  hideAlert();
                  lowQuantity = true;
                  return {
                    ...productRel,
                    ...product,
                    quantity: comboAvailable,
                    pickedQuantity: Math.floor(pickedQuantity / comboQuantity)
                  };
                },
                onCancel: () => {
                  hideAlert();
                },
                confirmText: 'Đồng ý',
                cancelText: 'Pick thêm',
              });
              return { ...productRel, ...product, pickedQuantity };
            } else if(pickedQuantity > productInComboAmountByBarcode * comboQuantity) {
              showAlert({
                title: 'SP vượt quá combo!',
                message: `Bạn có muốn tiếp tục?`,
                onConfirm: () => {
                  toggleShowAmountInput(false);
                  hideAlert();
                },
                onCancel: () => {
                  hideAlert();
                },
                confirmText: 'Đồng ý',
                cancelText: 'Sửa lại',
              });
              return { ...productRel, ...product, pickedQuantity };
            }
            toggleShowAmountInput(false);
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