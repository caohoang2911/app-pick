import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-detail';

const UserNote = () => {
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { note } = header || {};

  if (!note) return null;

  return (
    <View 
      className="p-3 mx-4 mb-3 rounded"
      style={{ backgroundColor: '#FFA500' }}
    >
      <View className='flex'>
        <Text className='text-white font-semibold text-sm'>{note}</Text>
      </View>
    </View>
  )
}

export default memo(UserNote);