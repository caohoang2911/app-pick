import { Link, router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { Badge } from '~/src/components/Badge';
import { Motobike } from '@/core/svgs';

const data = [
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
  { id: 5, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 6,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 7, title: 'title 3', details: 'details 3 details 3' },
  { id: 8, title: 'title 4 title 4', details: 'details 4' },
  { id: 9, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 10,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 11, title: 'title 3', details: 'details 3 details 3' },
  { id: 12, title: 'title 4 title 4', details: 'details 4' },
  { id: 13, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 14,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 15, title: 'title 3', details: 'details 3 details 3' },
  { id: 16, title: 'title 4 title 4', details: 'details 4' },
  { id: 17, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 18,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 19, title: 'title 3', details: 'details 3 details 3' },
  { id: 20, title: 'title 4 title 4', details: 'details 4' },
];

const ItemProduct = ({ id }: any) => {
  return (
    <TouchableOpacity
      onPress={() => {
        router.push('order-pick/1');
      }}
    >
      <View className="rounded-md border-bgPrimary border">
        <View className="bg-bgPrimary p-4 flex flex-row justify-between items-center">
          <View className="flex flex-row gap-2 items-center">
            <Motobike />
            <Text className="font-semibold text-base text-colorPrimary">
              Mã đơn OL100100
            </Text>
          </View>
          <Badge label={'Đang xác nhận'} variant={'default'} />
        </View>
        <View className="p-4 pt-2 gap-1">
          <Text className="font-semibold">Khách hàng: Minh Nguyễn</Text>
          <Text>
            Ngày tạo: <Text className="font-semibold">12/07/2024 10:00</Text>
          </Text>
          <Text>
            Ngày giao hàng:
            <Text className="font-semibold">12/07/2024 14:00</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const OrderList = () => {
  return (
    <View className="mt-4 flex-grow">
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
        data={data}
        renderItem={({ item }: { item: any }) => (
          <View key={item.title} className="my-3">
            <ItemProduct {...item} />
          </View>
        )}
      />
    </View>
  );
};

export default OrderList;
