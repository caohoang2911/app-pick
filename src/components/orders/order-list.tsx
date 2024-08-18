import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import moment from 'moment';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
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
import { SectionAlert } from '../SectionAlert';

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
    isFetching,
    refetch,
  } = useSearchOrders({
    keyword,
    status: selectedOrderCounter == 'ALL' ? undefined : selectedOrderCounter,
  });

  const withoutRefresh = useRef(false);
  const orderList = ordersResponse?.data?.list || [];

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

  if (isFetching && withoutRefresh.current) {
    return (
      <View className="text-center py-3">
        <ActivityIndicator className="text-gray-300" />
      </View>
    );
  }

  if (ordersResponse?.error) {
    return (
      <View className=" mt-2">
        <SectionAlert variant={'danger'}>
          <Text>Error: {ordersResponse?.error}</Text>
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
            onRefresh={() => {
              withoutRefresh.current = false;
              refetch();
            }}
          />
        }
        refreshing={isFetching}
        ListEmptyComponent={
          !isFetching ? (
            <View className="mt-3">
              <Text className="text-center">Không có dữ liệu</Text>
            </View>
          ) : (
            <></>
          )
        }
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
