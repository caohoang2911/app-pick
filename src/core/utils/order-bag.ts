import { OrderBagCode, OrderBagItem, OrderBagLabel, OrderBagType } from "~/src/types/order-bag";
import { Product, ProductItemGroup } from "~/src/types/product";

export const transformBagsData: any = (bags: OrderBagItem[]) => {
  if (!bags) return { DRY: [], FROZEN: [], FRESH: [] };
  const dry = bags.filter((bag) => bag.type === 'DRY');
  const frozen = bags.filter((bag) => bag.type === 'FROZEN');
  const fresh = bags.filter((bag) => bag.type === 'FRESH');

  const bagsType = {
    DRY: dry.map((bag: OrderBagItem, index: number) => ({ ...bag, name: generateBagName(OrderBagType.DRY, index + 1) })),
    FROZEN: frozen.map((bag: OrderBagItem, index: number) => ({ ...bag, name: generateBagName(OrderBagType.FROZEN, index + 1) })),
    FRESH: fresh.map((bag: OrderBagItem, index: number) => ({ ...bag, name: generateBagName(OrderBagType.FRESH, index + 1) })),
  };

  return bagsType;
}

export const generateBagCode = (type: OrderBagType, orderCode: string, bagLabels: OrderBagItem[]) => {
  const maxBugsCodeSuffixNumber = bagLabels.length > 0 ? Math.max(...bagLabels.map((bag) => {
    const code = bag.code.split('-')[1];
    const numberOnly = code.match(/\d+/); 
    return Number(numberOnly);
  })) : null;

  const index =  Boolean(maxBugsCodeSuffixNumber !== null && Number(maxBugsCodeSuffixNumber) >= 0) ? Number(maxBugsCodeSuffixNumber || 0) + 1 : 0;
  return `${orderCode}-${OrderBagCode[type]}${index < 10 ? `0${index}` : index}`;
}

export const generateBagName = (type: OrderBagType, index: number) => {
  return `${OrderBagLabel[type]} - ${index}`;
}

export const transformOrderBags = (orderBags: OrderBagItem[]) => {
  const dry = orderBags.filter((bag) => bag.type === 'DRY');
  const frozen = orderBags.filter((bag) => bag.type === 'FROZEN');
  const fresh = orderBags.filter((bag) => bag.type === 'FRESH');

  return { DRY: dry, FROZEN: frozen, FRESH: fresh };
}

export const getOrderPickProductsFlat = (products: Array<Product | ProductItemGroup | any>): Array<Product> => { 
  const productsFlat = products.flatMap((product: Product | ProductItemGroup | any) => {
    return [...(product.elements || [])];
  }) as Array<Product>;

  return [...productsFlat];
}

export const barcodeCondition = (barcode: string = '', refBarcodes: string[] = []) => {
  return refBarcodes.includes(barcode);
}

export const isValidOrderBagCode = (orderBagCode: string) => {
  if (!orderBagCode || typeof orderBagCode !== 'string') {
    return false;
  }
  
  // Check if string starts with "OL"
  if (!orderBagCode.startsWith("OL")) {
    return false;
  }
  
  // Check if string contains hyphens
  if (!orderBagCode.includes("-")) {
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
  barcode,
}: {
  orderPickProductsFlat: Array<Product>;
  currentId: number | null;
  isEditManual: boolean;
  barcode: string;
}) => {
  let indexOfCodeScanned = -1;

  const barcodeWithPickedTime = orderPickProductsFlat?.findIndex(
    item => (barcodeCondition(barcode, item?.refBarcodes) && item?.pickedTime)
  );

  const indexOfCodeScannedWithoutPickedTime = orderPickProductsFlat?.findIndex(
    item =>  isEditManual ? 
    item?.id === currentId : 
    (barcodeCondition(barcode, item?.refBarcodes)) && !item?.pickedTime);

    console.log('indexOfCodeScannedWithoutPickedTime', indexOfCodeScannedWithoutPickedTime);
    console.log('barcodeWithPickedTime', barcodeWithPickedTime);

  if(indexOfCodeScannedWithoutPickedTime === -1) {
    indexOfCodeScanned = barcodeWithPickedTime;
  } else {
    indexOfCodeScanned = indexOfCodeScannedWithoutPickedTime;
  }

  return indexOfCodeScanned;
}