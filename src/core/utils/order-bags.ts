import {
  OrderBagCode,
  OrderBagItem,
  OrderBagLabel,
  OrderBagType,
} from '~/src/types/order-bags';
import { Product, ProductItemGroup } from '~/src/types/product';
import { toUpper } from 'lodash';

const SUFFIX_BARCODE_LENGTH = 6;

export const transformBagsData: any = (bags: OrderBagItem[]) => {
  if (!bags) return { DRY: [], FROZEN: [], FRESH: [] };
  const dry = bags.filter((bag) => bag.type === 'DRY');
  const frozen = bags.filter((bag) => bag.type === 'FROZEN');
  const fresh = bags.filter((bag) => bag.type === 'FRESH');

  const bagsType = {
    DRY: dry.map((bag: OrderBagItem, index: number) => ({
      ...bag,
      name: generateBagName(OrderBagType.DRY, index + 1),
    })),
    FROZEN: frozen.map((bag: OrderBagItem, index: number) => ({
      ...bag,
      name: generateBagName(OrderBagType.FROZEN, index + 1),
    })),
    FRESH: fresh.map((bag: OrderBagItem, index: number) => ({
      ...bag,
      name: generateBagName(OrderBagType.FRESH, index + 1),
    })),
  };

  return bagsType;
};

export const generateBagCode = (
  type: OrderBagType,
  orderCode: string,
  bagLabels: OrderBagItem[],
) => {
  const maxBugsCodeSuffixNumber =
    bagLabels.length > 0
      ? Math.max(
          ...bagLabels.map((bag) => {
            const code = bag.code.split('-');

            const lastCode = code[code.length - 1];

            const numberOnly = lastCode.match(/\d+/);
            return Number(numberOnly);
          }),
        )
      : null;

  const index = Boolean(
    maxBugsCodeSuffixNumber !== null && Number(maxBugsCodeSuffixNumber) >= 0,
  )
    ? Number(maxBugsCodeSuffixNumber || 0) + 1
    : 0;
  return `${orderCode}-${OrderBagCode[type]}${index < 10 ? `0${index}` : index}`;
};

export const generateBagName = (type: OrderBagType, index: number) => {
  return `${OrderBagLabel[type]} - ${index}`;
};

export const transformOrderBags = (orderBags: OrderBagItem[] | undefined) => {
  if (!Array.isArray(orderBags)) {
    return { DRY: [], FROZEN: [], FRESH: [] };
  }
  const dry = orderBags.filter((bag) => bag.type === 'DRY');
  const frozen = orderBags.filter((bag) => bag.type === 'FROZEN');
  const fresh = orderBags.filter((bag) => bag.type === 'FRESH');

  return { DRY: dry, FROZEN: frozen, FRESH: fresh };
};

export const getOrderPickProductsFlat = (
  products: Array<Product | ProductItemGroup | any>,
): Array<Product> => {
  const productsFlat = products.flatMap(
    (product: Product | ProductItemGroup | any) => {
      return [...(product.elements || [])];
    },
  ) as Array<Product>;

  return [...productsFlat];
};

export const barcodeCondition = (
  barcode: string = '',
  refBarcodes: string[] = [],
) => {
  return refBarcodes.includes(barcode);
};

const matchesRefBarcodeKeyword = (
  refBarcode: string,
  keywordUpper: string,
): boolean => {
  const barcodeUpper = toUpper(refBarcode);

  if (barcodeUpper === keywordUpper) {
    return true;
  }

  // Cho phép nhập 6 số cuối của barcode (vd: 901015 → 9991105901015).
  return (
    keywordUpper.length >= SUFFIX_BARCODE_LENGTH &&
    /^\d+$/.test(keywordUpper) &&
    barcodeUpper.endsWith(keywordUpper)
  );
};

/** Khớp keyword với refBarcodes trên đơn; trả về mã ref gốc để dùng với handleScanBarcode. */
export const findMatchingRefBarcode = (
  keyword: string,
  orderPickProductsFlat: Product[],
): string | null => {
  const keywordUpper = toUpper(keyword.trim());
  if (!keywordUpper) return null;

  for (const product of orderPickProductsFlat) {
    for (const refBarcode of product.refBarcodes || []) {
      if (matchesRefBarcodeKeyword(refBarcode, keywordUpper)) {
        return refBarcode;
      }
    }
  }
  return null;
};

/** Resolve mã quét/nhập (kèm fallback bỏ 0 đầu) trước khi pick tuần tự. */
export const resolvePickScanBarcode = (
  rawKeyword: string,
  orderPickProductsFlat: Product[],
): string | null => {
  const trimmed = rawKeyword.trim();
  const matched = findMatchingRefBarcode(trimmed, orderPickProductsFlat);
  if (matched) return matched;

  if (
    !trimmed.startsWith('110') &&
    trimmed.length > 10 &&
    trimmed.startsWith('0')
  ) {
    return findMatchingRefBarcode(trimmed.slice(1), orderPickProductsFlat);
  }
  return null;
};

export const isValidOrderBagCode = (orderBagCode: string) => {
  if (!orderBagCode || typeof orderBagCode !== 'string') {
    return false;
  }

  // Check if string starts with "OL"
  if (!orderBagCode.startsWith('OL')) {
    return false;
  }

  // Check if string contains hyphens
  if (!orderBagCode.includes('-')) {
    return false;
  }

  // Check if length is exactly 15 characters
  if (orderBagCode.length !== 15) {
    return false;
  }

  return true;
};

export const handleScanBarcode = ({
  orderPickProductsFlat,
  currentId,
  isEditManual,
  isScanMoreProduct = false,
  barcode,
}: {
  orderPickProductsFlat: Array<Product>;
  currentId: number | null;
  isEditManual: boolean;
  isScanMoreProduct?: boolean;
  barcode: string;
}): number => {
  // Pick thêm: chỉ cộng vào SP đang mở và BẮT BUỘC barcode khớp SP đó.
  // Tránh quét mã SP khác trong đơn vẫn cộng SL/KG vào SP đang pick thêm.
  if (isScanMoreProduct && currentId !== null) {
    const index = orderPickProductsFlat.findIndex(
      (item) => item?.id === currentId,
    );
    if (index === -1) return -1;
    const current = orderPickProductsFlat[index];
    if (!barcodeCondition(barcode, current?.refBarcodes)) {
      return -1;
    }
    return index;
  }

  if (isEditManual && currentId !== null) {
    const index = orderPickProductsFlat.findIndex(
      (item) => item?.id === currentId,
    );
    if (index !== -1) return index;
  }

  const indexWithoutPickedTime = orderPickProductsFlat.findIndex(
    (item) => barcodeCondition(barcode, item?.refBarcodes) && !item?.pickedTime,
  );

  if (indexWithoutPickedTime !== -1) {
    return indexWithoutPickedTime;
  }

  const indexWithPickedTime = orderPickProductsFlat.findIndex(
    (item) =>
      barcodeCondition(barcode, item?.refBarcodes) && !!item?.pickedTime,
  );

  return indexWithPickedTime;
};
