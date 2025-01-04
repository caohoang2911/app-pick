export enum ProductLabelEnum {
  GIFT = 'GIFT',
  COMBO = 'COMBO',
  DRY = 'DRY',
  FROZEN = 'FROZEN',
  CHILL = 'CHILL',
  FRESH = 'FRESH',
}

export type Product = {
  pId: number;
  pickedError?: string;
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
  unit?: string;
  gifts?: Array<{ name: string; image: string }>;
  extraConversionQuantity?: number;
};
