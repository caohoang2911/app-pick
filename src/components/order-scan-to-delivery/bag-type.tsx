import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { OrderBagItem, OrderBagType } from '~/src/types/order-bag';
import BagItem from './bag-item';

const BagType = ({
  title,
  bagLabels,
  type,
}: {
  title: string;
  bagLabels: OrderBagItem[];
  type: OrderBagType;
}) => {

  if(bagLabels.length === 0) return null;

  return (
    <View className="bg-white rounded-md overflow-hidden">
      <View className="flex flex-col">
        <View className="flex-row justify-between items-center bg-blue-50 p-3 rounded-t-md">
          <Text className="text-base font-semibold">{title}</Text>
          <Text className="text-base text-gray-500">SL: {bagLabels?.length}</Text>
        </View>
        <View className="p-2 gap-2 border-blue-50 border">
          {bagLabels?.map(({ code, type, name, isDone }) => (
            <BagItem key={code} code={code} type={type} name={name} isDone={isDone} />
          ))}
        </View>
      </View>
    </View>
  )
}

export default BagType;