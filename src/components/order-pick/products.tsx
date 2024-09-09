import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import OrderPickProduct from './product';
import { useLocalSearchParams } from 'expo-router';
import { Product } from '~/src/types/product';
import {
  setBarcodeScrollTo,
  setInitOrderPickProducts,
  useOrderPick,
} from '~/src/core/store/order-pick';
import clsx from 'clsx';
import { stringUtils } from '~/src/core/utils/string';

const OrderPickProducts = () => {
  const { code } = useLocalSearchParams<{
    code: string;
    status: OrderStatus;
  }>();
  const barcodeScrollTo = useOrderPick.use.barcodeScrollTo();
  const keyword = useOrderPick.use.keyword();
  

  const ref: any = useRef<FlatList>();

  const { data, refetch, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderDetail = data?.data || {};
  const { error } = data || {};
  const { productItems } = orderDetail?.delivery || {};

  const filterProductItems = useMemo(() => {
    return productItems?.filter((productItem: Product) => {

      if (!keyword) return true;
      const byProductName = stringUtils.removeAccents(productItem.name?.toLowerCase()).includes(stringUtils.removeAccents(keyword.toLowerCase()));
      const byProductBarcode = productItem.barcode?.toLowerCase().includes(keyword.toLowerCase());

      return byProductBarcode || byProductName;
    });
  }, [productItems, keyword]);

  useEffect(() => {
    const obj: any = {};
    productItems?.forEach((productItem: Product) => {
      obj[productItem.barcode] = { ...productItem };
    });

    setInitOrderPickProducts(obj);
  }, [productItems]);

  const indexCurrentProduct = useMemo(
    () =>
      productItems?.findIndex((productItem: Product) => {
        return productItem.barcode === barcodeScrollTo;
      }),
    [barcodeScrollTo, productItems]
  );

  useEffect(() => {
    if (indexCurrentProduct !== -1) {
      setTimeout(() => {
        // ref.current?.scrollToIndex({
        //   animated: true,
        //   index: indexCurrentProduct || 0,
        //   viewPosition: 0.5,
        // });
        setBarcodeScrollTo('');
      }, 500);
    }
  }, [indexCurrentProduct]);

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
    <View className="flex-1 flex-grow mt-2">
      <FlatList
        ref={ref}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any, index: number) => item.name + index}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        data={filterProductItems as Array<any>}
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
        }) => {
          const isLast = Boolean(
            index === Number((productItems || []).length - 1)
          );
          return (
            <View
              key={index}
              className={clsx('px-4 mb-4', { 'mb-10': isLast })}
            >
              <OrderPickProduct {...item} />
            </View>
          );
        }}
      />
    </View>
  );
};

export default OrderPickProducts;
