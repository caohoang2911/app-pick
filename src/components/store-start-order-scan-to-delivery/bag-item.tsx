import React from 'react';
import { Text, View } from 'react-native';
import CheckCircleFill from '~/src/core/svgs/CheckCircleFill';
import { OrderBagItem } from '~/src/types/order-bag';

const BagItem = ({
  code,
  isDone,
  lastScannedTime,
}: Pick<OrderBagItem, 'code' | 'isDone' | 'lastScannedTime'>) => {

  const isScanned = lastScannedTime || isDone;
  
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-base text-gray-500">{code}</Text>
      <View className="flex-row items-center gap-3">
        <View className="rounded-full bg-white ">
          <CheckCircleFill style={{opacity: isScanned ? 1 : 0.6}} color={isScanned ? 'green' : 'gray'}/>
        </View>
      </View>
    </View>
  )
}

export default React.memo(BagItem);