import { TouchableOpacity } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const dataStatus = [
  {
    id: 'all',
    label: 'Tất cả (25)',
  },
  {
    id: 'confirm',
    label: 'Đã xác nhận (10)',
  },
  {
    id: 'pick',
    label: 'Đang pick (2)',
  },
  {
    id: 'picked',
    label: 'Đã Pick (0)',
  },
  {
    id: 'packing',
    label: 'Đang soạn hàng (5)',
  },
  {
    id: 'shipping',
    label: 'Đang vận chuyển (30)',
  },
  {
    id: 'complete',
    label: 'Đã hoàn thành (10)',
  },
];

export function TabsStatus({ statusSeleted = 'shipping', onPressItem }: any) {
  const ref = useRef<any>();

  useEffect(() => {
    const index = dataStatus.findIndex(
      (status) => status.id === (statusSeleted as any)
    );

    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
    });
  }, [statusSeleted]);

  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={dataStatus}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isStatusSeleted = item.id === statusSeleted;
        const isFirst = index === 0;
        const isLast = index === dataStatus?.length - 1;

        return (
          <TouchableOpacity key={item.id} onPress={() => onPressItem(item.id)}>
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
                {item.label}
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
