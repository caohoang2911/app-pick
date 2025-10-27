export type OrderItemGroup = {
  type: 'COMBO' | 'PRODUCT' | 'GIFT_PACK';
  name: string;
  quantity: number;
  elementRatio: {
    [key: string]: number;
  };
  elements?: Array<OrderItem>;
};

export type GiftPack = Pick<OrderItemGroup, 'type' | 'name' | 'elements'>;

export type OrderItem = {
  type?: 'GIFT';
  id: number;
  substituteItems?: Array<OrderItem>;
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
  };
};
