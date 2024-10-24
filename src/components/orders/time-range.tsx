import { TouchableOpacity } from '@gorhom/bottom-sheet';
import Feather from '@expo/vector-icons/Feather';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useGetOrderStatusCounters } from '~/src/api/app-pick';
import { useRefreshOnFocus } from '~/src/core/hooks/useRefreshOnFocus';
import { setExpectedDeliveryTimeRange, useOrders } from '~/src/core/store/orders';
import { colors } from '~/src/ui/colors';

export function TimeRange() {
  const ref = useRef<any>();
  const deliveryType = useOrders.use.deliveryType();

  const { data, refetch } = useGetOrderStatusCounters({ deliveryType });
  const orderStatusCounters = data?.data || {};
  const { error } = data || {};
  const expectedDeliveryTimeRange = useOrders.use.expectedDeliveryTimeRange();

  const isFirtTime = useRef(true);

  useRefreshOnFocus(async () => {
    if (!isFirtTime.current) {
      refetch();
    }
    isFirtTime.current = false;
  });

  console.log(orderStatusCounters, "orderStatusCounters")

  const dataTimeRanges = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => (
      {
        id: `${i + 8 < 10 ? `0${i + 8}` : i + 8}-${i + 9 < 10 ? `0${i + 9}` : i + 9}`,
        label: `${i + 8}:00 - ${i + 9}:00`,
      }
    ))
  }, [])

  const goTabSelected = useCallback((expectedDeliveryTimeRange?: string) => {
    const index = dataTimeRanges.findIndex(
      (status) => status.id === (expectedDeliveryTimeRange as any) || status.id === expectedDeliveryTimeRange
    );
    if (index === -1) return;
    
    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index: index || 0,
        viewPosition: 0.5,
      });
    }, 200);
  }, [expectedDeliveryTimeRange])

  useEffect(() => {
    goTabSelected(expectedDeliveryTimeRange);
  }, [expectedDeliveryTimeRange]);

  if (error) return <></>;

  return (
    <FlatList
      className="mt-3"
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={dataTimeRanges || []}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isTimeSeleted = item.id === expectedDeliveryTimeRange;
        const isFirst = index === 0;
        const isLast = index === dataTimeRanges?.length - 1;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              goTabSelected(item.id);
              setExpectedDeliveryTimeRange(item.id)
            }}
          >
            <View
              className={clsx('py-1 border border-gray-200 rounded-md', {
                'pr-4': isFirst,
                'px-3': !isFirst,
                'mx-1': !isFirst && !isLast,
                'px-0 pl-3': isLast,
                'bg-blue-50': isTimeSeleted,
              })}
            >
              <View className="flex flex-row items-center gap-2">
                {isTimeSeleted && (
                  <Feather name="check" size={16} color={colors.colorPrimary} />
                )}
                <Text
                  className={clsx({
                    'color-colorPrimary font-semibold': isTimeSeleted,
                    'color-gray-500': !isTimeSeleted,
                  })}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      horizontal
    />
  );
}
