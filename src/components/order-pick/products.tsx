import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import OrderPickProduct from './product';
import { useLocalSearchParams } from 'expo-router';
import { Product } from '~/src/types/product';
import { setInitOrderPickProducts } from '~/src/core/store/order-pick';

const OrderPickProducts = () => {
  const { code } = useLocalSearchParams<{
    code: string;
    status: OrderStatus;
  }>();

  const { data, refetch, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderDetail = data?.data || {};
  const { error } = data || {};
  const { productItems } = orderDetail?.deliveries?.[0] || {};

  console.log(productItems, 'productItemsproductItemsproductItems');

  useEffect(() => {
    const obj: any = {};
    productItems?.forEach((productItem: Product) => {
      obj[productItem.barcode] = { number: 0 };
    });

    setInitOrderPickProducts(obj);
  }, [productItems]);

  if (error) {
    return (
      <View className="text-center mt-2">
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="text-center py-3">
        <ActivityIndicator className="text-gray-300" />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-grow">
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any, index: number) => item.name + index}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        data={productItems as Array<any>}
        ListEmptyComponent={
          !isFetching ? (
            <View className="mt-3">
              <Text className="text-center">Không có dữ liệu</Text>
            </View>
          ) : (
            <></>
          )
        }
        renderItem={({
          item,
          index,
        }: {
          item: Array<Product>;
          index: number;
        }) => (
          <View key={index} className="px-4 mt-2">
            <OrderPickProduct
              {...item}
              isLast={index === Number((productItems || []).length - 1)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default OrderPickProducts;
