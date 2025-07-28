import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextStyle, TouchableOpacity, View, LayoutChangeEvent } from 'react-native';
import { useGetOrderDeliveryTypeCounters } from '~/src/api/app-pick/use-get-order-delivery-type-counters';
import { queryClient } from '~/src/api/shared';
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
  "OFFLINE_HOME_DELIVERY",
  "APARTMENT_COMPLEX_DELIVERY",
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
  const fromScanQrCode = useOrders.use.fromScanQrCode();

  const isFirtTime = useRef(true);

  const { data, refetch } = useGetOrderDeliveryTypeCounters({ storeCode, status: fromScanQrCode ? 'ALL' : selectedOrderCounter });

  const counters = data?.data ? { ...cachingShippingMethods.current, ...data.data } : {};

  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const scrollEnabled = contentWidth > containerWidth;

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
  }, [fromScanQrCode, selectedOrderCounter, storeCode])


  const handleSelect = (value: string) => {
    queryClient.invalidateQueries({ queryKey: ['getOrderStatusCounters', storeCode] });
    if(refCurrentStatus.current === value) {
      setDeliveryType(null);
      refCurrentStatus.current = null;
    } else {
      setDeliveryType(value);
      refCurrentStatus.current = value;
    }
  };


  const options: DeliveryTypeOption[] = useMemo(() => {
    return Object.keys(counters).filter((status) => pickStatus.includes(status)).map((status) => {
      const shippingMethodName = getConfigNameById(orderDeliveryTypes, status)

      const textClasses = deliveryType === status ? 'text-blue-600' : 'text-gray-500';
      const backgroundColorClass = deliveryType === status ? 'bg-blue-50' : 'bg-slate-100';

      return ({
        label: <TouchableOpacity onPress={() => handleSelect(status)}>
          <View className={`flex flex-row items-center rounded-full py-1 px-2 ${backgroundColorClass}`}>
            <Text numberOfLines={1} className={`${textClasses} font-medium text-sm`}>{shippingMethodName || status}</Text>
            <Text className={`${textClasses} text-lg`}> • </Text>
            <Text className={`${textClasses} font-medium text-sm`}>{counters[status] || 0}</Text>
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
    <View 
      className='flex flex-row'
      onLayout={(event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
        style={{ flex: 1 }}
        scrollEnabled={scrollEnabled}
        onContentSizeChange={(width) => {
          setContentWidth(width);
        }}
      >
        {options?.map((item, index) => {
          const isLast = index === options.length - 1;
          return (
            <View key={index} className={`${isLast ? 'mr-0' : 'mr-2'}`}>
              {item.label}
            </View>
          )
        })}
      </ScrollView>
    </View>
  );
}

export default DeliveryType;
