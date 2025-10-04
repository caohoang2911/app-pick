import { OrderStatus } from './order';
import { Product, ProductItemGroup } from './product';
import { Customer, Employee } from './employee';
import { ORDER_DELIVERY_TYPE } from '~/src/contants/order';

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


export type Payment = {
  isPaid?: boolean;
  method?: string;
  transactionId?: string;
  provider?: string;
  providerName?: string;
  amount?: number;
  methodName?: string;
};

export type Voucher = {
  discountAmount?: number;
  isRefundable?: boolean;
  name?: string;
  voucherCode?: string;
};

export type OrderDelivery = {
  code?: string;
  shippingDiscount?: number;
  storeCode?: string;
  storeAddress?: string;
  productItems?: Product[];
  productItemGroups?: Array<Product | ProductItemGroup>
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
  proofDeliveryImages?: string[];
  isRequireSelectShippingPackageSize?: boolean;
  groupShippingPickedStatues?: {[key: string]: boolean};
  saleChannel?: string;
  groupShippingTotalCODAmount?: number;
  groupShippingOrderCodes?: Array<string>;
  deliveryType: ORDER_DELIVERY_TYPE;
  taxAuthorityCode?: string;
  promotions?: Array<any>;
  vouchers?: Array<Voucher>;
  invoiceCode?: string;
  groupBuyOrderCodes?: Array<string>;
  overdueTimeUpdateStatus?: number;
  code?: string;
  customer?: Customer;
  status?: number | string;
  refund?: TemplateOrderRefund;
  statusName?: string;
  picker?: {
    username?: string;
    name?: string;
  };
  isExistCallLog?: boolean;
  shipping?: {
    serviceId: string;
    serviceName?: string;
    method: string;
    provider?: string;
    fee?: number;
    packageName?: string;
    distance: number;
    driverName?: string;
    driverPhone?: string;
    duration: number;
    trackingLink: string;
    trackingNumber: string;
    isOnWheel?: boolean;
    packageSize?: string;
    priceAmount?: number;
    discountAmount?: number;
  };
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
  extraPayments: {
    isPaid?: boolean;
    method?: string;
    transactionId?: string;
    provider?: string;
    amount?: number;
    methodName?: string;
  }[];
  incurredPayment?: {
    amount: number;
    type: 'REFUND' | 'COD';
  };
  fulfillError?: {
    type?: string;
    messages?: Array<string>;
  };
  lastTimeUpdateStatus?: number;
  amount?: number;
  codAmount?: number;
  discountAmount?: number;
  employeeId?: number;
  assignee?: Employee;
  payStatus?: number;
  pickerNote?: string;
  orderTime?: number;
  isOverdueSLA?: boolean;
  deliveryTimeRange?: Array<number>;
  deliveryAddress?: DeliveryAddress;
  statusLogs?: {
    activity?: string;
    time?: number;
  };
  genVATUrl?: string;
  vat?: VAT;
  logs?: Array<LogOrder>;
  warnings?: Array<string>;
  cancel?: any;
  tags?: Array<string>;
  bagLabels?: Array<string>;
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
