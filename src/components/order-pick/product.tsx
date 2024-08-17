import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../Badge';
import { Product } from '~/src/types/product';
import { formatCurrency, formatNumber } from '~/src/core/utils/number';
import { useOrderPick } from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const OrderPickProduct = ({
  name,
  image,
  barcode,
  sellPrice,
  unit,
  quantity,
  stockAvailable,
}: Partial<Product | any>) => {
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();

  return (
    <>
      <View className="border rounded-md border-gray-200 overflow-hidden">
        <View className="p-4">
          {orderPickProducts?.[barcode]?.picked && (
            <View className="absolute z-10 left-2 top-2">
              <CheckCircleFill color={'green'} />
            </View>
          )}
          <View className="flex-row justify-between gap-4">
            <Image
              style={{ width: 100, height: 100 }}
              source={image}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <View className="flex-grow flex-row justify-between">
              <View className="flex gap-2">
                <Text className="font-semibold">Số lượng đặt: {quantity}</Text>
                <Text className="">
                  Thực pick: {orderPickProducts?.[barcode]?.number || 0}
                </Text>
                <Text className="text-gray-500">
                  Tồn kho: {formatNumber(stockAvailable)}
                </Text>
                <View className="flex flex-row gap-2">
                  <Badge label={'Chill'} />
                  <Badge label={'Dry'} />
                </View>
              </View>
            </View>
          </View>
          <View className="border my-3 border-gray-100" />
          <View className="flex gap-3">
            <Text className="text-lg font-semibold">{name}</Text>
            <View className="flex-row gap-3 items-center">
              <Text className="text-gray-500">SKU: {barcode}</Text>
              <View className="size-1.5 rounded-full bg-gray-200" />
              <Text className="text-gray-500">
                Giá: {formatCurrency(sellPrice)}
              </Text>
              <View className="size-1.5 rounded-full bg-gray-200" />
              <Text className="text-gray-500">Unit: {unit}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default OrderPickProduct;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
