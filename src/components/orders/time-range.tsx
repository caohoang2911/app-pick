import Feather from '@expo/vector-icons/Feather';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { setExpectedDeliveryTimeRange } from '~/src/core/store/orders';
import { cn } from '~/src/lib/utils';
import { colors } from '~/src/ui/colors';

export function TimeRange() {
  const ref = useRef<any>();
  const [timeRange, setTimeRange] = useState(-1);

  const dataTimeRanges = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => (
      {
        id: `${i * 2 + 8 < 10 ? `0${i * 2 + 8}` : i * 2 + 8}-${i * 2 + 10 < 10 ? `0${i * 2 + 10}` : i * 2 + 10}`,
        label: `${i * 2 + 8}:00 - ${i * 2 + 10}:00`,
      }
    ))
  }, [])

  const goTabSelected = useCallback((index: number) => {

    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index: index || 0,
        viewPosition: 0.5,
      });
    }, 200);
  }, [])

  return (
    <FlatList
      className="mt-3"
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={dataTimeRanges || []}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isTimeSeleted = index === timeRange;
        const isFirst = index === 0;
        const isLast = index === dataTimeRanges?.length - 1;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              goTabSelected(index);
              if(!isTimeSeleted) {
                setTimeRange(index);
                setExpectedDeliveryTimeRange(item.id)
              } else {
                setExpectedDeliveryTimeRange("")
                setTimeRange(-1);
              }
            }}
          >
            <View
              className={'mx-1 py-1 border border-gray-200 rounded-md'}
               style={{
                marginLeft: isFirst ? 0 : 4,
                marginRight: isLast ? 0 : 4,
                backgroundColor: isTimeSeleted ? colors.blue[50] : 'transparent',
              }}
            >
              <View className="flex flex-row items-center px-2 gap-1">
                {isTimeSeleted && (
                  <Feather name="check" size={16} color={colors.colorPrimary} />
                )}
                <Text
                  className={cn('text-center',{
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
