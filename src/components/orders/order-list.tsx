import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { Badge } from '~/src/components/Badge';
import { useSearchOrders } from '~/src/api/app-pick/use-search-orders';
import { useOrders } from '~/src/core/store/orders';
import { toLower } from 'lodash';
import { SectionAlert } from '../SectionAlert';
import { queryClient } from '~/src/api/shared';

const ItemProduct = ({
  statusName,
  orderTime,
  code,
  status,
  customer,
  selectedOrderCounter,
  expectedDeliveryTimeRange,
}: {
  statusName: string;
  orderTime: string;
  code: string;
  status: OrderStatus;
  customer: any;
  selectedOrderCounter?: OrderStatus;
  expectedDeliveryTimeRange?: any;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        router.push({ pathname: `orders/${code}`, params: { status } });
      }}
    >
      <View className="rounded-md border-bgPrimary border">
        <View className="bg-bgPrimary p-4 flex flex-row justify-between items-center">
          <Text className="font-semibold text-base text-colorPrimary">
            # {code}
          </Text>
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
              &nbsp;{expectedDeliveryTime(expectedDeliveryTimeRange).day} -{' '}
              {expectedDeliveryTime(expectedDeliveryTimeRange).hh}
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

  const firtTime = useRef<boolean>(true);

  const {
    data: ordersResponse,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    isRefetching
  } = useSearchOrders({
    keyword,
    status: selectedOrderCounter === 'ALL' ? undefined : selectedOrderCounter,
  });



  const withoutRefresh = useRef(false);
  const orderList = ordersResponse?.pages || []

  useEffect(() => {
    withoutRefresh.current = true;
    firtTime.current = false;
    refetch();
  }, [selectedOrderCounter, keyword]);

  useFocusEffect(
    useCallback(() => {
      console.log('Hello, I am focused!');
      if (!firtTime.current) {
        refetch();
      }
      return () => {
        console.log('This route is now unfocused.');
      };
    }, [])
  );

  const renderFooterList = useMemo(() => {
    if (isFetchingNextPage) return <ActivityIndicator color={"blue"} />;
    if (!hasNextPage && !isFetchingNextPage && !isFetching) return <Text className="text-center text-xs text-gray-500">Danh sách đã hết</Text>;
    return <View />;
  }, [isFetchingNextPage, hasNextPage, isFetching]);

  if (isFetching && withoutRefresh.current) {
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
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              withoutRefresh.current = false;
              await  queryClient.setQueryData(['searchOrders'], (data: any) => ({
                pages: [],
                pageParams: data.pageParams,
              }))
              refetch()
            }}
          />
        }
        ListEmptyComponent={
          !isFetching ? (
            <View className="mt-3">
              <Text className="text-center">Không có dữ liệu</Text>
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
            fetchNextPage();
          }
        }}
        ListFooterComponent={renderFooterList}
        keyExtractor={(item, idx) => idx + item.id}
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

const expectedDeliveryTime = (expectedDeliveryTimeRange: Array<any>): any => {
  const startTime = expectedDeliveryTimeRange?.[0];
  const endTime = expectedDeliveryTimeRange?.[1];

  if (!startTime || !endTime) return '-';
  if (moment(startTime).valueOf() === moment(endTime).valueOf())
    return moment(startTime).format('HH:mm') + ' - ';
  return {
    day: moment(startTime).format('DD/MM/YYYY'),
    hh:
      moment(startTime).format('HH:mm') +
      ' - ' +
      moment(endTime).format('HH:mm'),
  };
};
