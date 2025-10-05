import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-pick';
import Ionicons from '@expo/vector-icons/Ionicons';

const UserNote = () => {
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { pickerNote } = header || {};

  if (!pickerNote) return null;

  const lines = pickerNote?.trim().split('\\n');
  
  return (
    <View className="mx-4 px-3 mb-3 py-2 rounded flex bg-orange-400">
        {lines.map((line) => (
          <View key={line}  className="flex-col">
            <Text className="text-base font-semibold text-white">
              {line.trim()}
            </Text>
          </View>
        ))}
    </View>
  );
};

export default memo(UserNote);
