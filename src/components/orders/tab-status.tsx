import { TouchableOpacity } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useGetOrderStatusCounters } from '~/src/api/app-pick';
import {
  ORDER_COUNTER_STATUS,
  ORDER_COUNTER_STATUS_PRIORITY,
} from '~/src/contants/order';
import { useRefreshOnFocus } from '~/src/core/hooks/useRefreshOnFocus';
import { setSelectedOrderCounter, useOrders } from '~/src/core/store/orders';

export function TabsStatus() {
  const ref = useRef<any>();

  const { data, refetch } = useGetOrderStatusCounters();
  const orderStatusCounters = data?.data || {};
  const { error } = data || {};
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();

  const isFirtTime = useRef(true);

  useRefreshOnFocus(async () => {
    if (!isFirtTime.current) {
      refetch();
    }
    isFirtTime.current = false;
  });

  console.log(orderStatusCounters, "orderStatusCounters")

  const dataStatusCounters = Object.keys(orderStatusCounters)?.map(
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
      className="mt-6"
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
              goTabSelected(item.id);
              setSelectedOrderCounter(item.id)
            }}
          >
            <View
              className={clsx('py-1 rounded', {
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
                {item.label} ({item.number})
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

function sortByPriority(data: Array<any>) {
  return data.sort((a, b) => a.priority - b.priority);
}
