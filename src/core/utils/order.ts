import { OrderStatus, OrderStatusValue } from '~/src/types/order';

export const isEnableScanToDelivery = ({
  status,
}: {
  status: OrderStatus | undefined;
}) => {
  if (!status) return false;
  return [
    OrderStatusValue.BOOKED_SHIPPER,
    OrderStatusValue.STORE_PACKED,
    OrderStatusValue.SHIPPING,
  ].includes(status as OrderStatusValue);
};
