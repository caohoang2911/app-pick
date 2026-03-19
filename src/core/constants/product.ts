export const PRODUCT_PICKED_ERROR_TYPES = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  QUALITY_DECLINE: 'QUALITY_DECLINE',
  INCORRECT_STOCK: 'INCORRECT_STOCK',
  NEAR_EXPIRY_DATE_NOT_YET_DISCOUNT_STAMPED:
    'NEAR_EXPIRY_DATE_NOT_YET_DISCOUNT_STAMPED',
  EXPIRED_ONLINE_SALE_DATE_NOT_YET_DISCOUNT_DATE:
    'EXPIRED_ONLINE_SALE_DATE_NOT_YET_DISCOUNT_DATE',
  INCORRECT_ORDERED_WEIGHT: 'INCORRECT_ORDERED_WEIGHT',
  PICK_WEIGHT_EXCEEDS_LIMIT: 'PICK_WEIGHT_EXCEEDS_LIMIT',
} as const;

export const PRODUCT_ACTIONS = {
  OUT_OF_STOCK: 'out-of-stock',
  LOW_QUALITY: 'low-quality',
  NEAR_EXPIRY: 'near-expiry',
  EXPIRED_ONLINE: 'expired-online',
  INCORRECT_STOCK: 'incorrect-stock',
  PICK_WEIGHT_EXCEEDS_LIMIT: 'pick-weight-exceeds-limit',
} as const;

export const PRODUCT_ACTION_LABELS = {
  [PRODUCT_ACTIONS.OUT_OF_STOCK]: 'Sản phẩm hết hàng',
  [PRODUCT_ACTIONS.LOW_QUALITY]: 'Sản phẩm giảm chất lượng',
  [PRODUCT_ACTIONS.NEAR_EXPIRY]: 'SP cận hạn sử dụng, chưa dán tem giảm giá',
  [PRODUCT_ACTIONS.EXPIRED_ONLINE]:
    'SP quá hạn bán online, chưa đến hạn giảm giá',
  [PRODUCT_ACTIONS.INCORRECT_STOCK]: 'Sản phẩm sai tồn',
  [PRODUCT_ACTIONS.PICK_WEIGHT_EXCEEDS_LIMIT]:
    'SP vượt quá trọng lượng tối đa được phép chọn',
} as const;

export type ProductAction =
  (typeof PRODUCT_ACTIONS)[keyof typeof PRODUCT_ACTIONS];
