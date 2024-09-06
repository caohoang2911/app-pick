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
import { formatCurrency } from '~/src/core/utils/number';
import { getConfigNameById } from '~/src/core/utils/config';
import { useConfig } from '~/src/core/store/config';

const ItemProduct = ({
  statusName,
  orderTime,
  code,
  status,
  customer,
  selectedOrderCounter,
  expectedDeliveryTimeRange,
  amount,
  tags,
  note,
}: {
  statusName: string;
  orderTime: string;
  code: string;
  status: OrderStatus;
  customer: any;
  selectedOrderCounter?: OrderStatus;
  expectedDeliveryTimeRange?: any;
  createdDate: string;
  amount: number;
  tags: Array<any>;
  note: string;
}) => {
  const router = useRouter();

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

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
          <Badge label={selectedOrderCounter === 'ALL' ? statusName : ''} extraLabel={<Text className="text-xs text-contentPrimary">{selectedOrderCounter === 'ALL' && ` | `}{moment(orderTime).fromNow()}</Text>} variant={toLower(status) as any} />
        </View>
        <View className="p-4 pt-2 gap-1">
          <Text className="font-semibold">Khách hàng: {customer?.name}</Text>
          <Text>
            Giá trị đơn:{' '}
            <Text className="font-semibold">
              &nbsp;{formatCurrency(amount, {unit: true})}
            </Text>
          </Text>
          <Text>
            Giao hàng:
            <Text className="font-semibold">
              &nbsp;{expectedDeliveryTime(expectedDeliveryTimeRange).day} -{' '}
              {expectedDeliveryTime(expectedDeliveryTimeRange).hh}
            </Text>
          </Text>
          {tags?.length > 0 && 
            <View className="pt-1 flex flex-row gap-2">
              {tags?.map((tag: string, index: number) => {
                const tagName = getConfigNameById(orderTags, tag)
                return <>
                  <Badge key={index} label={tagName as string} variant={tag?.startsWith("ERROR") ? "danger" : "default"} className="self-start rounded-md"/>
                </>
              })}
            </View>
          }
          {note && (
            <Text className="text-sm text-gray-500" numberOfLines={1}>{note}</Text>
          )}
        </View>
        
      </View>
    </TouchableOpacity>
  );
};

const OrderList = () => {
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const keyword = useOrders.use.keyword();

  const firtTime = useRef<boolean>(true);

  const params = useMemo(() => ({
    keyword,
    status: selectedOrderCounter
  }), [keyword, selectedOrderCounter])

  const {
    data: ordersResponse,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    isRefetching,
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
  }, [selectedOrderCounter, keyword]);

  useFocusEffect(
    useCallback(() => {
      console.log('Hello, I am focused!');
      if (!firtTime.current) {
        refetch();
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
            withoutRefresh.current = false;
            fetchNextPage();
          }
        }}
        ListFooterComponent={renderFooterList}
        keyExtractor={(item: any, index: number) => index + item.code}
        renderItem={({ item }: { item: any }) => (
          <View className="my-3">
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
