import clsx from 'clsx';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import {
  setInitOrderPickProducts,
  setOrderDetail,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { stringUtils } from '~/src/core/utils/string';
import { OrderStatus } from '~/src/types/order';
import { Product, ProductItemGroup } from '~/src/types/product';
import Empty from '../shared/Empty';
import OrderPickProduct from './product';
import ProductCombo from './product-combo';
import ProductGift from './product-gift';

const OrderPickProducts = () => {
  const { code } = useLocalSearchParams<{
    code: string;
    status: OrderStatus;
  }>();
  const barcodeScrollTo = useOrderPick.use.barcodeScrollTo();
  const keyword = useOrderPick.use.keyword();

  const orderPickProducts = useOrderPick.use.orderPickProducts();

  const ref: any = useRef<FlatList>();

  const { data, refetch, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  useEffect(() => {
    setOrderDetail(data?.data || {});
  }, [data]);

  const orderDetail = data?.data || {};
  const { productItemGroups, productItemsV2 } = orderDetail?.delivery || {};

  const filterProductItems = useMemo(() => {

    return orderPickProducts?.filter((products: Array<Product>) => {
      if (!keyword) return true;

      if(products.length === 1) {
        const byProductName = stringUtils.removeAccents(products[0].name?.toLowerCase()).includes(stringUtils.removeAccents(keyword.toLowerCase()));
        const byProductBarcode = products[0].barcode?.toLowerCase().includes(keyword.toLowerCase());
        return byProductBarcode || byProductName;
      }
      
      return true;
    });
  }, [keyword, orderPickProducts]);

  useEffect(() => {
    const tempArr = Object.values(productItemsV2 || {}).map((item: any) => {
      return item;
    }) || [];

    setInitOrderPickProducts([...tempArr] as never[]);
  }, [productItemsV2]);

  const indexCurrentProduct = useMemo(
    () =>
      orderPickProducts.flat().findIndex((productItem: Product) => {
        return productItem.barcode === barcodeScrollTo;
      }),
    [barcodeScrollTo, orderPickProducts]
  );

  useEffect(() => {
    if (indexCurrentProduct !== -1) {
      setTimeout(() => {
        try {
          ref.current?.scrollToIndex({
            animated: true,
            index: indexCurrentProduct || 0,
            viewPosition: 0.5,
          });
        } catch (error) {
          console.log('error', error);
        }
      }, 500);
    }
  }, [indexCurrentProduct]);

  if (isPending || isFetching) {
    return (
      <View className="text-center py-3">
        <ActivityIndicator className="text-gray-300" />
      </View>
    );
  }

  const renderItem = (item: Product | ProductItemGroup | any) => {
    if(item.type === "COMBO" && 'elements' in item) {
      return <ProductCombo combo={item as ProductItemGroup} />;
    }
    if(item.type === "GIFT_PACK" && 'elements' in item) {
      return <ProductGift giftPack={item as ProductItemGroup} />;
    }

    return <OrderPickProduct {...(item as Product)} />;
    
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
              <Empty />
            </View>
          ) : (
            <></>
          )
        }
        renderItem={({
          item,
          index,
        }: {
          item: Product | ProductItemGroup;
          index: number;
        }) => {
          const isLast = Boolean(
            index === Number((orderPickProducts || []).length - 1)
          );
         
          return (
            <View
              key={index}
              className={clsx('px-4 mb-4', { 'mb-10': isLast })}
            >
              {renderItem(item)}
            </View>
          );
        }}
      />
    </View>
  );
};

export default OrderPickProducts;
