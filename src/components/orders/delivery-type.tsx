import React, { useEffect, useMemo, useRef } from 'react'
import { View, Text, TextStyle } from 'react-native';
import Segmented from '../Segmented';
import { setDeliveryType, useOrders } from '~/src/core/store/orders';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';

type DeliveryTypeOption = {
  label: React.ReactNode;
  value: string;
}

const pickStatus = [
  "SHIPPER_DELIVERY",
  "CUSTOMER_PICKUP",
  "STORE_DELIVERY",
]


function DeliveryType() {
  const cachingShippingMethods = useRef<any>(null);

  const deliveryType = useOrders.use.deliveryType();
  const { storeCode } = useAuth.use.userInfo();

  const config = useConfig.use.config();
  const orderDeliveryTypes = config?.orderDeliveryTypes || [];


  const { data } = useQuery({
    queryKey: ['getOrderStatusCounters', deliveryType, useOrders.use.operationType(), storeCode]
  });

  const counters = {...cachingShippingMethods.current, ...(data as any)?.data} || {};

  const options: DeliveryTypeOption[] = useMemo(() => {
    return Object.keys(counters).filter((status) => pickStatus.includes(status)).map((status) => {
      const shippingMethodName = getConfigNameById(orderDeliveryTypes, status)

      const textStyle: TextStyle = {
        color: '#000',
        ...(deliveryType === status && {
          color: '#fff',
        })
      }

      return ({
        label: <View className='flex flex-row items-center gap-1 mx-4'>
          <Text numberOfLines={1} style={{...textStyle}}>{shippingMethodName || status}</Text>
          <Text style={{...textStyle}}>({counters[status] || 0})</Text>
        </View>,
        value: status,
      })
    })
  }, [counters, orderDeliveryTypes])

  useEffect(() => {
    cachingShippingMethods.current = counters;
  }, [counters])

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
