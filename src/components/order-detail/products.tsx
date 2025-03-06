import clsx from 'clsx';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useCallback, memo, useState } from 'react';
import { ActivityIndicator, Text, View, Dimensions } from 'react-native';
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

// Memoize các component hiển thị trạng thái loading và empty
const LoadingIndicator = memo(() => (
  <View className="text-center py-3">
    <ActivityIndicator className="text-gray-300" />
  </View>
));

const EmptyProductList = memo(() => (
  <View className="mt-3">
    <Empty />
  </View>
));

// Memoize các component render item
const ProductItem = memo(({ 
  item, 
  isLast 
}: { 
  item: Product | ProductItemGroup | any, 
  isLast: boolean 
}) => {
  // Xác định loại sản phẩm và render component tương ứng
  const renderProduct = () => {
    if(item.type === "COMBO" && 'elements' in item) {
      return <ProductCombo combo={item as ProductItemGroup} />;
    }
    if(item.type === "GIFT_PACK" && 'elements' in item) {
      return <ProductGift giftPack={item as ProductItemGroup} />;
    }
    return <OrderPickProduct {...(item.elements?.[0] as Product)} />;
  };

  return (
    <View className={clsx('px-4 mb-4', { 'mb-10': isLast })}>
      {renderProduct()}
    </View>
  );
});

// Component chính
const OrderPickProducts = () => {
  const { code } = useLocalSearchParams<{
    code: string;
    status: OrderStatus;
  }>();
  
  const barcodeScrollTo = useOrderPick.use.barcodeScrollTo();
  const keyword = useOrderPick.use.keyword();
  const orderPickProducts = useOrderPick.use.orderPickProducts();

  const flatListRef = useRef<FlatList>(null);
  const hasPendingScroll = useRef(false);
  const [forceUpdate, setForceUpdate] = useState(false); // Để force re-render khi cần

  // Query data
  const { 
    data, 
    refetch, 
    isPending, 
    isFetching, 
    isLoading 
  } = useOrderDetailQuery({
    orderCode: code,
  });

  // Cập nhật order detail chỉ khi data thay đổi
  useEffect(() => {
    if (data?.data) {
      setOrderDetail(data.data);
    }
  }, [data]);

  // Khởi tạo products từ API response
  useEffect(() => {
    const productItemGroups = data?.data?.delivery?.productItemGroups;
    if (productItemGroups) {
      const tempArr = Object.values(productItemGroups).map((item: any) => item);
      setInitOrderPickProducts([...tempArr] as never[]);
    }
  }, [data?.data?.delivery?.productItemGroups]);

  // Tối ưu hóa filter products bằng useMemo
  const filteredProducts = useMemo(() => {
    if (!keyword || !orderPickProducts) return orderPickProducts;

    return orderPickProducts.filter((products: Array<Product>) => {
      if (!products) return false;
      if (products.length === 1) {
        const product = products[0];
        if (!product || !product.name) return false;
        
        const normalizedKeyword = stringUtils.removeAccents(keyword.toLowerCase());
        const normalizedName = stringUtils.removeAccents((product.name || '').toLowerCase());
        const normalizedBarcode = (product.barcode || '').toLowerCase();
        
        return normalizedName.includes(normalizedKeyword) || normalizedBarcode.includes(normalizedKeyword);
      }
      return true;
    });
  }, [keyword, orderPickProducts]);

  // Tìm index của sản phẩm cần scroll đến
  const indexCurrentProduct = useMemo(() => {
    if (!barcodeScrollTo || !orderPickProducts) return -1;
    
    for (let i = 0; i < orderPickProducts.length; i++) {
      const products = orderPickProducts[i];
      const foundProduct = products.find((product: Product) => product.barcode === barcodeScrollTo);
      if (foundProduct) return i;
    }
    return -1;
  }, [barcodeScrollTo, orderPickProducts]);

  // Scroll đến sản phẩm được quét
  useEffect(() => {
    if (indexCurrentProduct !== -1 && flatListRef.current) {
      hasPendingScroll.current = true;
      
      // Sử dụng setTimeout ngắn hơn
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            animated: true,
            index: indexCurrentProduct,
            viewPosition: 0.5,
          });
        } catch (error) {
          // Fallback khi scroll thất bại
          console.log('Scroll failed, trying offset method');
          
          // Scroll bằng offset
          const estimatedItemHeight = 200; // Ước tính chiều cao trung bình của mỗi item
          flatListRef.current?.scrollToOffset({
            animated: true,
            offset: estimatedItemHeight * indexCurrentProduct
          });
        } finally {
          hasPendingScroll.current = false;
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [indexCurrentProduct]);

  // Tính toán layout cho FlatList
  const getItemLayout = useCallback((_, index) => {
    const height = 200; // Ước tính trung bình chiều cao mỗi sản phẩm
    return {
      length: height,
      offset: height * index,
      index,
    };
  }, []);

  // Callback cho việc render item
  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const isLast = index === (filteredProducts?.length || 0) - 1;
    return <ProductItem item={item} isLast={isLast} />;
  }, [filteredProducts?.length]);

  // Key extractor tối ưu
  const keyExtractor = useCallback((item: any, index: number) => {
    return item.code ? `${item.code}_${index}` : `item_${index}`;
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle scroll failure
  const handleScrollToIndexFailed = useCallback((info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    // Tính toán scroll offset dựa trên số liệu thống kê
    const offset = info.averageItemLength * info.index;
    flatListRef.current?.scrollToOffset({ offset, animated: true });
    
    // Thử lại sau một khoảng thời gian ngắn
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          animated: true,
          index: info.index,
          viewPosition: 0.5
        });
      }
    }, 100);
  }, []);

  // Tính toán các giá trị mô tả trạng thái
  const isLoaded = !(isPending || isFetching || isLoading);
  const isEmpty = isLoaded && (!orderPickProducts || orderPickProducts.length === 0);

  // Render component loading
  if (isPending || isFetching || isLoading) {
    return <LoadingIndicator />;
  }

  // Window dimensions
  const { height } = Dimensions.get('window');
  const itemHeight = 200; // Ước tính chiều cao trung bình
  const visibleItems = Math.ceil(height / itemHeight);

  return (
    <View className="flex-1 flex-grow mt-2">
      <FlatList
        ref={flatListRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={handleRefresh} 
          />
        }
        data={filteredProducts as Array<any>}
        getItemLayout={getItemLayout}
        ListEmptyComponent={isEmpty ? <EmptyProductList /> : null}
        renderItem={renderItem}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        removeClippedSubviews={true}
        initialNumToRender={visibleItems}
        maxToRenderPerBatch={visibleItems}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 1,
        }}
      />
    </View>
  );
};

// Đặt displayName để dễ debug
OrderPickProducts.displayName = 'OrderPickProducts';

export default memo(OrderPickProducts);
