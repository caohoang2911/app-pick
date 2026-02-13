import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useOrderPick } from '~/src/core/store/order-pick';
import Ionicons from '@expo/vector-icons/Ionicons';

const UserNote = () => {
  const pickerNote = useOrderPick((s) => s.orderDetail?.header?.pickerNote);

  if (!pickerNote) return null;

  const lines = pickerNote
    ?.trim()
    .split(/\n+/)
    .filter((line) => line.trim());

  return (
    <View className="mx-4 px-3 mb-3 py-2 rounded flex bg-orange-400">
      {lines.map((line) => (
        <View key={line} className="flex flex-row">
          <View className="size-1.5 bg-white rounded-full mr-2 mt-2.5" />
          <Text className="text-base font-semibold text-white">
            {line.trim()}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default memo(UserNote);
