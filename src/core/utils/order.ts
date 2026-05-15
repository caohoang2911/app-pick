import { ORDER_DELIVERY_TYPE, ORDER_STATUS } from '@/core/constants/order';
import { OrderStatus, OrderStatusValue } from '~/src/types/order';
import { APP_ROUTES } from '..';

export type OrderShippingInfo = {
  driverName?: string;
  driverPhone?: string;
};

export const hasOrderDriverInfo = (
  shipping?: OrderShippingInfo,
): boolean => !!shipping?.driverName;

export const isApartmentComplexDriverHandover = ({
  deliveryType,
  status,
  shipping,
}: {
  deliveryType: ORDER_DELIVERY_TYPE | undefined;
  status: OrderStatus | undefined;
  shipping?: OrderShippingInfo;
}) =>
  deliveryType === ORDER_DELIVERY_TYPE.APARTMENT_COMPLEX_DELIVERY &&
  (hasOrderDriverInfo(shipping) || status === ORDER_STATUS.BOOKED_SHIPPER);

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

export const isHiddenScanToDelivery = ({
  deliveryType,
}: {
  deliveryType: ORDER_DELIVERY_TYPE | undefined;
}) => {
  return deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY;
};

export const getScanToDeliveryInfo = ({
  deliveryType,
  status,
  orderCode,
  shipping,
}: {
  deliveryType: ORDER_DELIVERY_TYPE | undefined;
  status: OrderStatus | undefined;
  orderCode: string;
  shipping?: OrderShippingInfo;
}): {
  title: string;
  route: string;
} | null => {
  if (!deliveryType) return null;
  if (deliveryType === ORDER_DELIVERY_TYPE.APARTMENT_COMPLEX_DELIVERY) {
    if (isApartmentComplexDriverHandover({ deliveryType, status, shipping })) {
      return {
        title: 'Scan túi - Giao hàng cho tài xế',
        route: APP_ROUTES.ORDER_SCAN_TO_DELIVERY(orderCode),
      };
    } else {
      const getRoute = () => {
        if (
          status === ORDER_STATUS.SHIPPING ||
          status === ORDER_STATUS.COMPLETED
        ) {
          return APP_ROUTES.STORE_COMPLETE_SCAN_TO_DELIVERY(orderCode);
        }
        return APP_ROUTES.STORE_START_SCAN_TO_DELIVERY(orderCode);
      };
      return {
        title: 'Scan túi - Giao hàng nội khu',
        route: getRoute(),
      };
    }
  }

  if (deliveryType === ORDER_DELIVERY_TYPE.CUSTOMER_PICKUP) {
    return {
      title: 'Scan túi - Giao hàng cho khách pickup',
      route: APP_ROUTES.ORDER_SCAN_TO_DELIVERY(orderCode),
    };
  }

  if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
    return {
      title: 'Scan túi - Giao hàng cho tài xế',
      route: APP_ROUTES.ORDER_SCAN_TO_DELIVERY(orderCode),
    };
  }

  return {
    title: 'Scan túi',
    route: '',
  };
};
