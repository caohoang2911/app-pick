export type OrderStatus = 'ALL' | 'CONFIRMED' | 'STORE_PICKING' | 'STORE_PACKED';

export enum HeavyProduct {
  STANDARD = 'STANDARD',
  SIZE_1 = 'SIZE_1',
  SIZE_2 = 'SIZE_2',
  SIZE_3 = 'SIZE_3',
}

export enum scheduleType {
  ORDER_DELIVERY_TIME = 'ORDER_DELIVERY_TIME',
  NOW = 'NOW',
}