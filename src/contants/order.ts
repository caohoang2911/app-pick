export const ORDER_COUNTER_STATUS: any = {
  ALL: 'Tất cả',
  CONFIRMED: 'Đã xác nhận',
  STORE_PICKING: 'Đang soạn hàng',
  STORE_PACKED: 'Soạn hàng xong',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
  BOOKED_SHIPPER: "Đã book shipper",
  SHIPPING: "Đang giao hàng"
};

export const ORDER_COUNTER_STATUS_PRIORITY: any = {
  ALL: 1,
  CONFIRMED: 2,
  STORE_PICKING: 3,
  STORE_PACKED: 4,
  BOOKED_SHIPPER: 5,
  SHIPPING: 6,
  COMPLETED: 7,
  CANCELLED: 8,
};

export const ORDER_STATUS = {
  ALL: 'ALL',
  CONFIRMED: 'CONFIRMED',
  STORE_PICKING: 'STORE_PICKING',
  STORE_PACKED: 'STORE_PACKED',
  BOOKED_SHIPPER: 'BOOKED_SHIPPER',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_ARRAY = Object.values(ORDER_STATUS);
