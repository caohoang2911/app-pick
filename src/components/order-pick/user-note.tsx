import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { OrderDetail } from '~/src/types/order-pick';

const UserNote = ({ orderDetail }: { orderDetail: OrderDetail }) => {
  const pickerNote = orderDetail?.header?.pickerNote;
  if (!pickerNote) return null;

  const lines = pickerNote
    ?.trim()
    .split(/\n+/)
    .filter((line) => line.trim());

  return (
    <View className="mx-4 px-3 mb-3 py-2 rounded-md bg-orange-400">
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
  );
};

export default memo(UserNote);
