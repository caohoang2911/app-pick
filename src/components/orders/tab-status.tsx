import { TouchableOpacity } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import { useFocusEffect } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useMemo } from 'react';
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
  const { data, refetch } = useGetOrderStatusCounters();
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

  const dataStatusCounters = useMemo(() => {
    return Object.keys(orderStatusCounters)?.filter(key => ORDER_COUNTER_STATUS_PRIORITY[key] !== undefined)?.map(
      (key: string) => {
        return {
          id: key,
          label: ORDER_COUNTER_STATUS[key],
          priority: ORDER_COUNTER_STATUS_PRIORITY[key],
          number: (orderStatusCounters as any)[key],
        };
      }
    );
  }, [orderStatusCounters]);

  const sortedDataStatusCounters = useMemo(() => {
    return sortByPriority(dataStatusCounters || []);
  }, [dataStatusCounters]);

  const goTabSelected = useCallback((id?: string) => {
    const index = sortedDataStatusCounters.findIndex(
      (status) => status.id === (selectedOrderCounter as any) || status.id === id
    );
    if (index === -1) return;

    setTimeout(() => {
      ref.current?.scrollToIndex?.({
        animated: true,
        index: index || 0,
        viewPosition: 0.5,
      });
    }, 500);
  }, [selectedOrderCounter, sortedDataStatusCounters])

  useEffect(() => {
    goTabSelected(selectedOrderCounter);
  }, [selectedOrderCounter, goTabSelected]);

  const handleTabPress = useCallback((itemId: string) => {
    refetch();
    goTabSelected(itemId);
    setSelectedOrderCounter(itemId as any);
  }, [refetch, goTabSelected]);

  const renderTabItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isStatusSeleted = item.id === selectedOrderCounter;
    const isFirst = index === 0;
    const isLast = index === sortedDataStatusCounters?.length - 1;
    
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleTabPress(item.id)}
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
  }, [selectedOrderCounter, sortedDataStatusCounters?.length, handleTabPress]);

  if (error) return <></>;

  return (
    <FlatList
      className="mt-4"
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={sortedDataStatusCounters}
      renderItem={renderTabItem}
      keyExtractor={(item) => item.id}
      horizontal
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={5}
    />
  );
}

export default memo(TabsStatus);

function sortByPriority(data: Array<any>) {
  return data.sort((a, b) => a.priority - b.priority);
}
