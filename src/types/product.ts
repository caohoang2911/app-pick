export enum ProductLabelEnum {
  GIFT = 'GIFT',
  COMBO = 'COMBO',
  DRY = 'DRY',
  FROZEN = 'FROZEN',
  CHILL = 'CHILL',
  FRESH = 'FRESH',
}

export type ProductItemGroup = {
  type: "COMBO" | "PRODUCT" | "GIFT_PACK";
  name: string;
  quantity: number;
  elementRatio: {
    [key: string]: number;
  }  
  elements?: Array<Product>;
}

export type GiftPack = Pick<ProductItemGroup, 'type' | 'name' | 'elements'>;

export type Product = {
  type?: "GIFT";
  id: number;
  substituteItems?: Array<Product>;
  pickedErrorType?: string;
  pickedNote?: string;
  pickedQuantity?: number;
  unitType?: string;
  quantity: number;
  pickedTime?: number;
  image?: string;
  tags?: Array<any>;
  name?: string;
  afterTaxPrice?: number;
  stockAvailable?: number;
  discount?: number;
  sellPrice?: number;
  attributes?: any;
  originPrice?: number;
  barcode?: string;
  baseBarcode?: string;
  orderQuantity: number;
  refBarcodes?: Array<string>;
  unit?: string;
  gifts?: Array<{ name: string; image: string }>;
  extraConversionQuantity?: number;
  categoryType?: string;
  vendorName?: string;
  pickedExtraQuantities?: {
    fullBoxQuantity?: number;
    openedBoxQuantity?: number;
  }
};
