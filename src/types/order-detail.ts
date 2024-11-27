import { OrderStatus } from './order';
import { Product } from './product';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  membership: any;
  numberOrders: number;
  spend: number;
  points: number;
};

export type DeliveryAddress = {
  city?: number;
  ward?: number;
  district?: number;
  address?: number;
  name?: string;
  phone?: string;
  note?: string;
  addressName?: string;
  fullAddress?: string;
};

export type Voucher = {
  discountAmount?: number;
  isRefundable?: boolean;
  name?: string;
  voucherCode?: string;
};

export type OrderDelivery = {
  originProductItems?: Array<any>;
  orderCode: string;
  invoice?: {
    id: string;
    code: string;
  };
  id?: number;
  pId?: string;
  code?: string;
  overdueTimeUpdateStatus?: number;
  company?: number;
  amount?: number;
  status?: boolean;
  shippingPrice?: number;
  shippingDiscount?: number;
  warnings?: Array<string>;
  shipper?: {
    name?: string;
    phone?: string;
  };
  storePicker?: {
    company?: string;
    name?: string;
    phone?: string;
  };
  storePacker?: {
    company?: string;
    name?: string;
    phone?: string;
  };
  shipping?: {
    serviceId: string;
    method: string;
    provider?: string;
    fee?: number;
    distance: number;
    duration: number;
    trackingLink: string;
    trackingNumber: string;
    isOnWheel?: boolean;
    packageSize?: string;
  };
  isOverdueSLA?: boolean;
  lastTimeUpdateStatus?: number;
  cod?: number;
  discount?: number;
  productItems?: Product[];
  orderTime?: number;
  statusLogs?: Array<LogOrder>;
  note?: string;
};

export type LogOrder = {
  action?: OrderStatus;
  time?: number;
  actionName?: string;
  notes?: Array<string>;
  user?: {
    company?: string;
    email?: string;
    name?: string;
    phone?: string;
  };
};

interface TemplateOrderRefund {
  requesterCode: string;
  requesterName: string;
  requesterPosition: string;
  requesterDepartment: string;
  orderCode: string;
  invoiceCode: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  createdDate: number;
  paymentDate: number;
  memberPointAmount: number;
}

export interface OrderDetailHeader {
  id?: number;
  groupShippingCode?: string;
  operationType?: "CAMPAIGN" | "EXPRESS" | null;
  groupShippingTotalCODAmount?: number;
  groupShippingOrderCodes?: Array<string>;
  groupShippingPickedStatues?: {[key: string]: boolean};
  deliveryType: 'DEFAULT' | 'CUSTOMER_PICKUP' | 'STORE_DELIVERY' | 'ORDER_PICK' | 'SHIPPER_DELIVERY';
  taxAuthorityCode?: string;
  promotions?: Array<any>;
  tags?: Array<string>;
  vouchers?: Array<Voucher>;
  groupBuyOrderCodes?: Array<string>;
  overdueTimeUpdateStatus?: number;
  code?: string;
  customer?: Customer;
  company?: number;
  status?: OrderStatus;
  sourceSale?: number;
  refund?: TemplateOrderRefund;
  statusName?: string;
  isExistCallLog?: boolean;
  codPenceExchange?: {
    penceAmount?: number;
    pointAmount?: number;
  };
  payment?: {
    isPaid?: boolean;
    method?: string;
    transactionId?: string;
    provider?: string;
    amount?: number;
    methodName?: string;
  };
  incurredPayment?: {
    amount: number;
    type: 'REFUND' | 'COD';
  };
  sourceSalePlatform?: 'APP' | 'WEB';
  error?: {
    messages?: Array<string>;
    name?: string;
  };
  lastTimeUpdateStatus?: number;
  amount?: number;
  codAmount?: number;
  discountAmount?: number;
  employeeId?: number;
  payStatus?: number;
  note?: string;
  orderTime?: number;
  isOverdueSLA?: boolean;
  deliveryTimeRange: Array<number>;
  deliveryAddress?: DeliveryAddress;
  statusLogs?: {
    action?: string;
    time?: number;
  };
  genVATUrl?: string;
  vat?: VAT;
  logs?: Array<LogOrder>;
  warnings?: Array<string>;
  cancel?: any;
}

export interface OrderDetail {
  header?: OrderDetailHeader;
  delivery?: OrderDelivery;
}

export interface VAT {
  address?: string;
  email?: string;
  name?: string;
  note?: string;
  phone?: string;
  taxCode?: string;
}
