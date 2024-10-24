import React from 'react'
import Segmented from '../Segmented';
import { setDeliveryType, useOrders } from '~/src/core/store/orders';

type DeliveryTypeOption = {
  label: string;
  value: string;
}

const options: DeliveryTypeOption[] = [
  { label: 'Delivery', value: 'ONLINE_DELIVERY' },
  { label: 'Pickup', value: 'CUSTOMER_PICKUP' },
];

function DeliveryType() {

  const deliveryType = useOrders.use.deliveryType();

  const handleSelect = (value: string) => {
    setDeliveryType(value);
  };

  return (
    <Segmented
      options={options}
      selected={deliveryType}
      onSelect={handleSelect}
    />
  );
}

export default DeliveryType;
