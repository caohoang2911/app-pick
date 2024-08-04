import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../Badge';
import { TouchableOpacity } from 'react-native-gesture-handler';
const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const OrderPickProduct = ({ title, onScan }: { title: string }) => {
  return (
    <>
      <View className="border rounded-md border-gray-200 overflow-hidden">
        <View className="p-4">
          <View className="flex-row justify-between gap-4">
            <Image
              style={{ width: 100, height: 100 }}
              source="https://storage.googleapis.com/sc_pcm_product/prod/2024/8/3/502676-81K_3.jpg"
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <View className="flex-grow flex-row justify-between">
              <View className="flex gap-2">
                <Text className="font-semibold">Số lượng đặt: 5</Text>
                <Text className="">Thực pick: 0</Text>
                <Text className="text-gray-500">Tồn kho: 500</Text>
                <View className="flex flex-row gap-2">
                  <Badge label={'Chill'} />
                  <Badge label={'Dry'} />
                </View>
              </View>
            </View>
          </View>
          <View className="border my-3 border-gray-100" />
          <View className="flex gap-3">
            <Text className="text-lg font-semibold">
              Nước ngọt Pepsi 330ml lốc 6 lon
            </Text>
            <View className="flex-row gap-4">
              <Text className="text-gray-500">SKU: 1020304</Text>
              <Text className="text-gray-500">Giá: 50,000đ</Text>
              <Text className="text-gray-500">Unit: Pack</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onScan} style={{ flex: 1 }}>
          <View className="bg-blue-500 p-3 mt-6">
            <Text className="text-center text-white">Scan</Text>
          </View>
        </TouchableOpacity>
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
