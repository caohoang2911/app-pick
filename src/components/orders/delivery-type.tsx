import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { useGetOrderDeliveryTypeCounters } from '~/src/api/app-pick/use-get-order-delivery-type-counters';
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

  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const operationType = useOrders.use.operationType();
  const fromScanQrCode = useOrders.use.fromScanQrCode();

  const isFirtTime = useRef(true);

  const { data, refetch } = useGetOrderDeliveryTypeCounters({ operationType, storeCode, status: fromScanQrCode ? 'ALL' : selectedOrderCounter });

  const counters = {...cachingShippingMethods.current, ...(data as any)?.data} || {};

  useFocusEffect(
    useCallback(() => {
      if (!isFirtTime.current) {
        refetch();
      }
      return () => {
        isFirtTime.current = false;
      };
    }, [])
  );

  useEffect(() => {
    refetch();
  }, [fromScanQrCode, selectedOrderCounter, operationType, storeCode])


  const options: DeliveryTypeOption[] = useMemo(() => {
    return Object.keys(counters).filter((status) => pickStatus.includes(status)).map((status) => {
      const shippingMethodName = getConfigNameById(orderDeliveryTypes, status)

      const textClasses = deliveryType === status ? 'text-blue-600' : 'text-gray-600';
      const backgroundColorClass = deliveryType === status ? 'bg-blue-50' : 'bg-gray-100';

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
          <View className={`flex flex-row items-center gap-1 rounded-full py-1 px-3 ${backgroundColorClass}`}>
            <Text numberOfLines={1} className={`${textClasses} font-medium text-xs`}>{shippingMethodName || status}</Text>
            <Text className={`${textClasses} font-medium text-xs`}>({counters[status] || 0})</Text>
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
