export type OrderBagWeightType = {
  id: string;
  name: string;
};

export type ConfigOption = {
  id: string;
  name: string;
};

export type Config = {
  orderStatuses: [];
  paymentMethods: [];
  sourceSales: [];
  wards: [];
  districts: [];
  cities: [];
  stores: [];
  orderDeliveryTypes: [];
  productPickedErrorTypes: [];
  orderTags: [];
  orderItemTags: [];
  fulfillErrorTypes: [];
  employeeRoles: [];
  orderBagWeightTypes?: OrderBagWeightType[];
  orderShippingCancelReasons?: ConfigOption[];
  shippingServiceTypes?: ConfigOption[];
};
