import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-detail';
import Ionicons from '@expo/vector-icons/Ionicons';

const UserNote = () => {
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { pickerNote } = header || {};

  if (!pickerNote) return null;

  return (
    <View className="mx-4 px-3 mb-3 py-2 rounded flex flex-row items-center gap-1 bg-orange-400">
      <Ionicons name="information-circle-outline" size={20} color="white" />
      <Text className="text-base font-semibold text-white">
        {pickerNote?.trim()}
      </Text>
    </View>
  );
};

export default memo(UserNote);
