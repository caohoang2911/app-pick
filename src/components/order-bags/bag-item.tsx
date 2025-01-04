import React from 'react';
import { Text, View } from 'react-native';
import { OrderBagItem } from '~/src/types/order-bag';
import { Button } from '../Button';
import { removeOrderBag } from '~/src/core/store/order-bag';
import { router } from 'expo-router';
const BagItem = ({
  code,
  type,
}: OrderBagItem) => {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-base text-gray-500">{code}</Text>
      <View className="flex-row items-center gap-3">
        {/* <Button variant="text" label={"In Tem"} size="sm" onPress={() => router.push(`/orders/print-preview?code=${code}&type=${type}`)} labelClasses="text-colorPrimary text-base"  className="px-0"/> */}
        <Button
          variant="text"
          label={"Xoá"}
          onPress={() => removeOrderBag(code, type)}
          labelClasses="text-red-500 text-base"
          size="sm"
          className="px-0"
        />
      </View>
    </View>
  )
}

export default BagItem;