import React, { useEffect } from 'react';
import { View } from 'react-native';
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

  const { data, refetch } = useOrderDetailQuery({ orderCode: code });

  const orderDetail = data?.data || {};
  const { productItems } = orderDetail?.deliveries?.[0] || {};

  useEffect(() => {
    const obj: any = {};
    productItems?.forEach((productItem: Product) => {
      obj[productItem.barcode] = { number: 0 };
    });

    setInitOrderPickProducts(obj);
  }, [productItems]);

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
        data={productItems as []}
        renderItem={({
          item,
          index,
        }: {
          item: Array<Product>;
          index: number;
        }) => (
          <View key={index} className="my-3">
            <OrderPickProduct {...item} />
          </View>
        )}
      />
    </View>
  );
};

export default OrderPickProducts;
