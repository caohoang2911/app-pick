import React, { useState } from 'react';
import { View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import OrderPickProduct from './order-pick-product';
import ScannerBox from '../shared/ScannerBox';
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

const OrderPickProducts = ({ onScan }: { onScan: () => void }) => {
  return (
    <View className="mt-4 flex-1 flex-grow">
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
            <OrderPickProduct {...item} onScan={onScan} />
          </View>
        )}
      />
    </View>
  );
};

export default OrderPickProducts;
