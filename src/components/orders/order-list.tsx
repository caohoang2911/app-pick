import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import moment from 'moment';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { Badge } from '~/src/components/Badge';
import { Motobike } from '@/core/svgs';
import { useSearchOrders } from '~/src/api/app-pick/use-search-orders';
import { useOrders } from '~/src/core/store/orders';
import { toLower } from 'lodash';

const ItemProduct = ({
  statusName,
  orderTime,
  code,
  status,
  customer,
  selectedOrderCounter,
}: {
  statusName: string;
  orderTime: string;
  code: string;
  status: OrderStatus;
  customer: any;
}) => {
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
              Mã đơn {code}
            </Text>
          </View>
          {selectedOrderCounter === 'ALL' && (
            <Badge label={statusName} variant={toLower(status) as any} />
          )}
        </View>
        <View className="p-4 pt-2 gap-1">
          <Text className="font-semibold">Khách hàng: {customer?.name}</Text>
          <Text>
            Ngày tạo:{' '}
            <Text className="font-semibold">
              &nbsp;{moment(orderTime).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Text>
          <Text>
            Ngày giao hàng:
            <Text className="font-semibold">
              &nbsp;{moment(orderTime).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const OrderList = () => {
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const keyword = useOrders.use.keyword();

  const {
    data: ordersResponse,
    isFetching,
    refetch,
  } = useSearchOrders({
    keyword,
    status: selectedOrderCounter == 'ALL' ? undefined : selectedOrderCounter,
  });

  const withoutRefresh = useRef(false);
  const orderList = ordersResponse?.data.list;

  useEffect(() => {
    withoutRefresh.current = true;
    refetch();
  }, [selectedOrderCounter, keyword]);

  if (isFetching && withoutRefresh.current) {
    return (
      <View className="text-center py-3">
        <ActivityIndicator className="text-gray-300" />
      </View>
    );
  }

  if (ordersResponse?.error) {
    return (
      <View className="text-center">
        <Text>Error: {ordersResponse?.error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-grow mb-4">
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              withoutRefresh.current = false;
              refetch();
            }}
          />
        }
        refreshing={isFetching}
        ListEmptyComponent={<Text className="text-center mt-3">Empty</Text>}
        data={orderList}
        renderItem={({ item }: { item: any }) => (
          <View key={item.id} className="my-3">
            <ItemProduct
              {...item}
              selectedOrderCounter={selectedOrderCounter}
            />
          </View>
        )}
      />
    </View>
  );
};

export default OrderList;
