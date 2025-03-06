import React from 'react';
import { Text, View } from 'react-native';
import { OrderBagItem } from '~/src/types/order-bag';
import { Button } from '../Button';
import { removeOrderBag } from '~/src/core/store/order-bag';
import { router } from 'expo-router';
import CheckCircleFill from '~/src/core/svgs/CheckCircleFill';

const BagItem = ({
  code,
  type, 
  name,
  isDone,
}: OrderBagItem & { isDone: boolean }) => {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-base text-gray-500">{code}</Text>
      <View className="flex-row items-center gap-3">
        <View className="rounded-full bg-white ">
          <CheckCircleFill color={isDone ? 'green' : 'gray'}/>
        </View>
      </View>
    </View>
  )
}

export default React.memo(BagItem);