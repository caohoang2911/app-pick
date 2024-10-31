import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  FlatList,
  RefreshControl
} from 'react-native-gesture-handler';
import { useSearchOrders } from '~/src/api/app-pick/use-search-orders';
import { queryClient } from '~/src/api/shared';
import { useOrders } from '~/src/core/store/orders';
import { SectionAlert } from '../SectionAlert';
import OrderItem from './order-item';
import moment from 'moment';
import { useAuth } from '~/src/core';
import Empty from '../shared/Empty';

const getExpectedDeliveryTime = (expectedDeliveryTimeRange: string) => {
  if(!expectedDeliveryTimeRange) return "";
  const expectedDeliveryDate = [moment(new Date()).format('DD/MM/YYYY')];
  const expectedDeliveryTimeStart = expectedDeliveryTimeRange ? expectedDeliveryTimeRange.split('-')[0] : '';
  const expectedDeliveryTimeEnd = expectedDeliveryTimeRange ? expectedDeliveryTimeRange.split('-')[1] : '';
  const expectedDelivery = [
    moment(
      expectedDeliveryDate + ' ' + expectedDeliveryTimeStart,
      'DD/MM/YYYY HH:mm:ss'
    ).valueOf(),
    moment(
      expectedDeliveryDate + ' ' + expectedDeliveryTimeEnd,
      'DD/MM/YYYY HH:mm:ss'
    ).valueOf() - 1000,
  ];

  return expectedDelivery.join('-');
}

const OrderList = () => {
  const flatListRef = useRef<FlatList>(null);
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const keyword = useOrders.use.keyword();
  const deliveryType = useOrders.use.deliveryType();
  const expectedDeliveryTimeRange = useOrders.use.expectedDeliveryTimeRange();
  const operationType = useOrders.use.operationType();

  const { storeCode } = useAuth.use.userInfo();

  const firtTime = useRef<boolean>(true);

  const params = useMemo(() => ({
    keyword,
    status: selectedOrderCounter,
    deliveryType,
    expectedDeliveryTimeRange: getExpectedDeliveryTime(expectedDeliveryTimeRange),
    operationType,
    storeCode,
  }), [keyword, selectedOrderCounter, deliveryType, expectedDeliveryTimeRange, operationType, storeCode])

  const {
    data: ordersResponse,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    hasPreviousPage
  } = useSearchOrders({...params});


  const withoutRefresh = useRef(false);
  const orderList = ordersResponse?.pages || []

  const goFirstPage = async () => {
    await queryClient.setQueryData(['searchOrders', params], (data: any) => ({
      pages: [],
      pageParams: data?.pageParams,
    }))
    refetch();
  }

  useEffect(() => {
    withoutRefresh.current = true;
    goFirstPage();
  }, [selectedOrderCounter, keyword, expectedDeliveryTimeRange, deliveryType, operationType]);

  useFocusEffect(
    useCallback(() => {
      console.log('Hello, I am focused!');
      if (!firtTime.current) {
        refetch();
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
      }
      return () => {
        firtTime.current = false;
        console.log('This route is now unfocused.');
      };
    }, [])
  );
  

  const renderFooterList = useMemo(() => {
    if (isFetchingNextPage) return <ActivityIndicator color={"blue"} />;
    if (!hasNextPage && !isFetchingNextPage && !isFetching && orderList.length) return <Text className="text-center text-xs text-gray-500">Danh sách đã hết</Text>;
    return <View />;
  }, [isFetchingNextPage, hasNextPage, isFetching, orderList]);

  if (!hasPreviousPage && isFetching && withoutRefresh.current) {
    return (
      <View className="text-center py-3">
        <ActivityIndicator className="text-gray-300" />
      </View>
    );
  }


  if ((ordersResponse as any)?.error) {
    return (
      <View className=" mt-2">
        <SectionAlert variant={'danger'}>
          <Text>Error: {(ordersResponse as any)?.error}</Text>
        </SectionAlert>
      </View>
    );
  }

  return (
    <View className="flex-grow mb-4">
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ref={flatListRef}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              withoutRefresh.current = false;
              goFirstPage();
            }}
          />
        }
        ListEmptyComponent={
          !isFetching ? (
            <View className="mt-3">
              <Empty />
            </View>
          ) : (
            <></>
          )
        }
        refreshing={isFetching}
        data={orderList}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if(hasNextPage && !isFetching) {
            withoutRefresh.current = false;
            fetchNextPage();
          }
        }}
        ListFooterComponent={renderFooterList}
        keyExtractor={(item: any, index: number) => index + item.code}
        renderItem={({ item }: { item: any }) => (
          <View className="my-3">
            <OrderItem
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
