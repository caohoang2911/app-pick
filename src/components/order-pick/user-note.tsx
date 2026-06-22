import clsx from 'clsx';
import React, { memo } from 'react';
import { Platform, Text, View } from 'react-native';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-pick';

const stickyNoteShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
});

const UserNote = ({ orderDetail }: { orderDetail: OrderDetail }) => {
  const pickerNote = orderDetail?.header?.pickerNote;
  const isSticky = useOrderPick.use.isScrolledDown();

  if (!pickerNote) return null;

  const lines = pickerNote
    .trim()
    .split(/\n+/)
    .filter((line) => line.trim());

  return (
    <View
      className={clsx(
        isSticky ? 'bg-white -mt-3 pt-0 pb-2 z-10' : 'bg-gray-50',
      )}
      style={isSticky ? stickyNoteShadow : undefined}
    >
      <View
        className={clsx(
          'mx-4 px-3 py-2 rounded-md bg-orange-500',
          isSticky ? 'mb-0 ' : 'mb-3 ',
        )}
      >
        {lines.map((line, index) => (
          <View key={`${index}-${line}`} className="flex-row items-start">
            <View className="size-1.5 bg-white rounded-full mr-2 mt-2.5 shrink-0" />
            <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
              <Text className="text-base font-semibold text-white">
                {line.trim()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default memo(UserNote);
