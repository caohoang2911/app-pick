

export type OrderStatus = 'ALL' | 'CONFIRMED' | 'STORE_PICKING' | 'STORE_PACKED' | 'SHIPPING';

export enum OrderStatusValue {
  ALL = 'ALL',
  CONFIRMED = 'CONFIRMED',
  STORE_PICKING = 'STORE_PICKING',
  STORE_PACKED = 'STORE_PACKED',
  SHIPPING = 'SHIPPING',
}

export enum PackageSize {
  STANDARD = 'STANDARD',
  SIZE_1 = 'SIZE_1',
  SIZE_2 = 'SIZE_2',
  SIZE_3 = 'SIZE_3',
}

export enum PackageSizeLabel {
  STANDARD = 'Thông thường (50x40x50: 30kg - Miễn phí)',
  SIZE_1 = 'Mức 1 (60x50x60: 40kg - 10.000đ)',
  SIZE_2 = 'Mức 2 (70x60x70: 50kg - 20.000đ)',
  SIZE_3 = 'Mức 3 (90x90x90: 60kg - 40.000đ)',
}

export enum scheduleType {
  ORDER_DELIVERY_TIME = 'ORDER_DELIVERY_TIME',
  NOW = 'NOW',
}