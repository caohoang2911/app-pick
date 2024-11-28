import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Text, View } from 'react-native';
import BagItem from './bag-item';
import { OrderBagCode, OrderBagItem, OrderBagType } from '~/src/types/order-bag';
import { Button } from '../Button';
import { addOrderBag } from '~/src/core/store/order-bag';
import { useLocalSearchParams } from 'expo-router';
import { generateBagCode } from '~/src/core/utils/order-bag';

const BagType = ({
  title,
  bagLabels,
  type,
}: {
  title: string;
  bagLabels: OrderBagItem[];
  type: OrderBagType;
}) => {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <View className="bg-white mx-4 pt-3 rounded-md overflow-hidden">
      <View className="flex flex-col gap-2 px-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold">{title}</Text>
        <Text className="text-base text-gray-500">SL: {bagLabels.length}</Text>
        </View>
        {bagLabels?.map(({ code, type }) => (
          <BagItem key={code} code={code} type={type} />
        ))}
      </View>
      <View className="flex-row justify-center bg-blue-50 mt-3">
        <Button 
          icon={
            <AntDesign name="pluscircleo"
              size={17}
              color="#3280F6"
            />
          }
            onPress={() => addOrderBag({ code: generateBagCode(type, code, bagLabels.length + 1), type })}
          variant="text"
          label={"Thêm tem"}
          labelClasses="text-colorPrimary text-base font-semibold"
          className="w-full"
        />
      </View>
    </View>
  )
}

export default BagType;