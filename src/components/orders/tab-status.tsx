import { TouchableOpacity } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, memo } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useGetOrderStatusCounters } from '~/src/api/app-pick';
import {
  ORDER_COUNTER_STATUS,
  ORDER_COUNTER_STATUS_PRIORITY,
} from '~/src/contants/order';
import { useAuth } from '~/src/core';
import { setSelectedOrderCounter, useOrders } from '~/src/core/store/orders';

const TabsStatus = () => {
  const ref = useRef<any>();
  const cachingOrderStatusCounters = useRef<any>(null);

  const { storeCode } = useAuth.use.userInfo();
  const { data, refetch } = useGetOrderStatusCounters({ storeCode });
  const orderStatusCounters = data?.data ? { ...cachingOrderStatusCounters.current, ...data.data } : {};
  const { error } = data || {};
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();

  useEffect(() => {
    cachingOrderStatusCounters.current = orderStatusCounters;
  }, [orderStatusCounters])


  const isFirtTime = useRef(true);

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
  }, [storeCode])

  const dataStatusCounters = Object.keys(orderStatusCounters)?.filter(key => ORDER_COUNTER_STATUS_PRIORITY[key] !== undefined)?.map(
    (key: string) => {
      return {
        id: key,
        label: ORDER_COUNTER_STATUS[key],
        priority: ORDER_COUNTER_STATUS_PRIORITY[key],
        number: (orderStatusCounters as any)[key],
      };
    }
  );

  const goTabSelected = useCallback((id?: string) => {
    const index = dataStatusCounters.findIndex(
      (status) => status.id === (selectedOrderCounter as any) || status.id === id
    );
    if (index === -1) return;

    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index: index || 0,
        viewPosition: 0.5,
      });
    }, 500);
  }, [selectedOrderCounter])

  useEffect(() => {
    goTabSelected(selectedOrderCounter);
  }, [selectedOrderCounter]);

  if (error) return <></>;

  return (
    <FlatList
      className="mt-4"
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={sortByPriority(dataStatusCounters || [])}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isStatusSeleted = item.id === selectedOrderCounter;
        const isFirst = index === 0;
        const isLast = index === dataStatusCounters?.length - 1;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              refetch();
              goTabSelected(item.id);
              setSelectedOrderCounter(item.id)
            }}
          >
            <View
              className={clsx('py- rounded', {
                'pr-4': isFirst,
                'px-3': !isFirst,
                'px-0 pl-3': isLast,
              })}
            >
              <Text
                className={clsx({
                  'color-colorPrimary font-semibold': isStatusSeleted,
                  'color-gray-500': !isStatusSeleted,
                })}
              >
                <Text>{item.label}</Text> <Text className='text-blue text-lg'>•</Text> <Text>{item.number}</Text>
              </Text>
              {isStatusSeleted && (
                <View
                  style={{ height: 2, marginTop: 5 }}
                  className={clsx({
                    'rounded-t-md bg-colorPrimary': isStatusSeleted,
                  })}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      horizontal
    />
  );
}

export default memo(TabsStatus);

function sortByPriority(data: Array<any>) {
  return data.sort((a, b) => a.priority - b.priority);
}
