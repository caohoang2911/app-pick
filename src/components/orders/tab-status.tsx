import { TouchableOpacity } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import {
  OrderCounterResponse,
  useGetOrderStatusCounters,
} from '~/src/api/app-pick';
import { ORDER_COUNTER_STATUS } from '~/src/contants/order';
import { useRefreshOnFocus } from '~/src/core/hooks/useRefreshOnFocus';
import { setSelectedOrderCounter, useOrders } from '~/src/core/store/orders';

export function TabsStatus() {
  const ref = useRef<any>();

  const { data, refetch } = useGetOrderStatusCounters();
  const orderStatusCounters = data?.data || {};
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();

  useRefreshOnFocus(async () => {
    refetch();
  });

  const dataStatusCouters = Object.keys(orderStatusCounters)?.map(
    (key: string) => {
      return {
        id: key,
        label: ORDER_COUNTER_STATUS[key],
        number: (orderStatusCounters as any)[key],
      };
    }
  );

  useEffect(() => {
    const index = dataStatusCouters.findIndex(
      (status) => status.id === (selectedOrderCounter as any)
    );
    if (index === -1) return;

    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
    });
  }, [selectedOrderCounter]);

  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={dataStatusCouters || []}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isStatusSeleted = item.id === selectedOrderCounter;
        const isFirst = index === 0;
        const isLast = index === dataStatusCouters?.length - 1;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedOrderCounter(item.id)}
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
