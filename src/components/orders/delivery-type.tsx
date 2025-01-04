import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef } from 'react';
import { Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import { setDeliveryType, useOrders } from '~/src/core/store/orders';
import { getConfigNameById } from '~/src/core/utils/config';

type DeliveryTypeOption = {
  label: React.ReactNode | string;
  value: string;
}

const pickStatus = [
  "SHIPPER_DELIVERY",
  "STORE_DELIVERY",
  "CUSTOMER_PICKUP",
]


function DeliveryType() {
  const cachingShippingMethods = useRef<any>(null);

  const deliveryType = useOrders.use.deliveryType();
  const { storeCode } = useAuth.use.userInfo();

  const config = useConfig.use.config();
  const orderDeliveryTypes = config?.orderDeliveryTypes || [];
  const refCurrentStatus = useRef<string | null>(null);


  const { data } = useQuery({
    queryKey: ['getOrderStatusCounters', deliveryType, useOrders.use.operationType(), storeCode]
  });

  const counters = {...cachingShippingMethods.current, ...(data as any)?.data} || {};

  console.log(counters, "counters");

  const options: DeliveryTypeOption[] = useMemo(() => {
    return Object.keys(counters).filter((status) => pickStatus.includes(status)).map((status) => {
      const shippingMethodName = getConfigNameById(orderDeliveryTypes, status)

      const textStyle: TextStyle = {
        color: '#999999',
        ...(deliveryType === status && {
          color: '#fff',
        })
      }

      const backgroundColorClass = deliveryType === status ? 'bg-colorPrimary' : 'bg-gray-100';

      const handleSelect = (value: string) => {
        if(refCurrentStatus.current === value) {
          setDeliveryType(null);
          refCurrentStatus.current = null;
        } else {
          setDeliveryType(value);
          refCurrentStatus.current = value;
        }
      };
    
      return ({
        label: <TouchableOpacity onPress={() => handleSelect(status)}>
          <View className={`flex flex-row items-center gap-1 rounded-full py-1 px-2 ${backgroundColorClass}`}>
            <Text numberOfLines={1} style={{...textStyle}}>{shippingMethodName || status}</Text>
            <Text style={{...textStyle}}>({counters[status] || 0})</Text>
          </View>
        </TouchableOpacity>,
        value: status,
      })
    })
  }, [counters, orderDeliveryTypes, deliveryType])

  useEffect(() => {
    cachingShippingMethods.current = counters;
  }, [counters])

  return (
    <View className='flex flex-row items-center justify-end gap-2 pb-1'>
        {options.map((item, index) => (
          <View key={index}>
            {item.label}
          </View>
        ))}
    </View>
  );
}

export default DeliveryType;
