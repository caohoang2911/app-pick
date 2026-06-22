import { ProductAction } from '@/core/constants/product';
import { create } from 'zustand';
import { OrderDetail } from '~/src/types/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import { createSelectors } from '../../utils/browser';

interface OrderPickState {
  currentCode: string | null;
  isPickedByManualBarcodeInput: boolean;
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
  /** Các KG đã quét, chờ form append vào weightRangeItemKGs. */
  weightRangePendingScanKGs: number[];
  action: ProductAction | null;
  setAction: (action: ProductAction | null) => void;
  setScanMoreProduct: (isScanMoreProduct: boolean) => void;
  appendWeightRangeScanKg: (kg: number) => void;
  drainWeightRangePendingScanKGs: () => number[];
  clearWeightRangePendingScanKGs: () => void;
  setIsEditManual: (isEditManual: boolean, action?: ProductAction) => void;
  setKeyword: (keyword: string) => void;
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
  isScrolledDown: boolean;
  setIsScrolledDown: (value: boolean) => void;
  resetOrderPick: () => void;
  setCurrentCode: (code: string) => void;
  setIsPickedByManualBarcodeInput: (isManual: boolean) => void;
}

const roundWeightKg = (value: number) =>
  Math.round(Number(value) * 1000) / 1000;

const _useOrderPick = create<OrderPickState>((set, get) => ({
  orderDetail: {} as OrderDetail,
  currentCode: null,
  isPickedByManualBarcodeInput: false,
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
  weightRangePendingScanKGs: [],
  action: null,
  replacePickedProductId: null,
  isVisibleReplaceProduct: false,
  isScrolledDown: false,
  resetOrderPick: () => {
    set({
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
      weightRangePendingScanKGs: [],
      action: null,
      replacePickedProductId: null,
      isVisibleReplaceProduct: false,
      isPickedByManualBarcodeInput: false,
      isScrolledDown: false,
    });
  },
  setCurrentCode: (code: string) => {
    set({ currentCode: code });
  },
  setIsPickedByManualBarcodeInput: (isManual: boolean) => {
    set({ isPickedByManualBarcodeInput: isManual });
  },
  setScanMoreProduct: (isScanMoreProduct: boolean) => {
    set({ isScanMoreProduct });
  },
  appendWeightRangeScanKg: (kg: number) => {
    const rounded = roundWeightKg(kg);
    set((state) => ({
      weightRangePendingScanKGs: [...state.weightRangePendingScanKGs, rounded],
    }));
  },
  drainWeightRangePendingScanKGs: () => {
    const pending = get().weightRangePendingScanKGs;
    if (pending.length > 0) {
      set({ weightRangePendingScanKGs: [] });
    }
    return pending;
  },
  clearWeightRangePendingScanKGs: () => {
    set({ weightRangePendingScanKGs: [] });
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
  toggleScanQrCode: (isScanQrCodeProduct: boolean) => {
    set({ isScanQrCodeProduct });
  },
  toggleShowAmountInput: (isShowAmountInput: boolean, id?: number) => {
    set((state) => ({
      isShowAmountInput,
      scannedIds: id ? { ...state.scannedIds, [id]: true } : state.scannedIds,
    }));
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

    // Chỉ tạo reference mới cho element trùng product.id và group chứa nó;
    // element/group không đổi giữ nguyên reference để memo ở list không bị vô hiệu.
    const newOrderPickProducts = orderPickProducts.map(
      (productMap: Product | ProductItemGroup | any) => {
        const elements = productMap.elements as Product[] | undefined;
        if (!elements) return productMap;

        let changed = false;
        const newElements = elements.map((productRel: Product) => {
          if (product.id === productRel.id) {
            changed = true;
            return { ...productRel, ...product };
          }
          return productRel;
        });

        return changed ? { ...productMap, elements: newElements } : productMap;
      },
    );

    set({
      barcodeScrollTo: product.barcode,
      orderPickProducts: newOrderPickProducts,
    });
  },
  setReplacePickedProductId: (id: number) => {
    set({ replacePickedProductId: id });
  },
  setIsVisibleReplaceProduct: (isVisibleReplaceProduct: boolean) => {
    set({ isVisibleReplaceProduct });
  },
  setIsScrolledDown: (value: boolean) => {
    set({ isScrolledDown: value });
  },
}));

export const useOrderPick = createSelectors(_useOrderPick);

export const toggleScanQrCodeProduct = (status: boolean) =>
  _useOrderPick.getState().toggleScanQrCode(status);

export const resetOrderPick = () => _useOrderPick.getState().resetOrderPick();

export const setCurrentCode = (code: string) =>
  _useOrderPick.getState().setCurrentCode(code);

export const setIsPickedByManualBarcodeInput = (isManual: boolean) =>
  _useOrderPick.getState().setIsPickedByManualBarcodeInput(isManual);

export const toggleShowAmountInput = (
  isShowAmountInput: boolean,
  id?: number,
) => _useOrderPick.getState().toggleShowAmountInput(isShowAmountInput, id);

export const getIsShowAmountInput = () =>
  _useOrderPick.getState().isShowAmountInput;

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

export const appendWeightRangeScanKg = (kg: number) =>
  _useOrderPick.getState().appendWeightRangeScanKg(kg);

export const drainWeightRangePendingScanKGs = () =>
  _useOrderPick.getState().drainWeightRangePendingScanKGs();

export const clearWeightRangePendingScanKGs = () =>
  _useOrderPick.getState().clearWeightRangePendingScanKGs();

export const setIsScrolledDown = (value: boolean) =>
  _useOrderPick.getState().setIsScrolledDown(value);
