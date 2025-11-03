import { ORDER_DELIVERY_TYPE } from '~/src/contants/order';
import { OrderStatus, OrderStatusValue } from '~/src/types/order';

export const isEnableScanToDelivery = ({
  status,
  deliveryType,
}: {
  status: OrderStatus | undefined;
  deliveryType: ORDER_DELIVERY_TYPE;
}) => {
  if (!status) return false;
  return [
    OrderStatusValue.BOOKED_SHIPPER,
    OrderStatusValue.STORE_PACKED,
    OrderStatusValue.SHIPPING,
  ].includes(status as OrderStatusValue) && deliveryType !== ORDER_DELIVERY_TYPE.APARTMENT_COMPLEX_DELIVERY;
};
