import { useFocusEffect } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  FlatList,
  RefreshControl
} from 'react-native-gesture-handler';
import { useSearchOrders } from '~/src/api/app-pick/use-search-orders';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { queryClient } from '~/src/api/shared';
import { setUser, useAuth } from '~/src/core';
import { removeItem } from '~/src/core/storage';
import { setToken, setUserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';
import { setFromScanQrCode, useOrders } from '~/src/core/store/orders';
import { SectionAlert } from '../SectionAlert';
import Empty from '../shared/Empty';
import OrderItem from './order-item';

// Tách OrderItem thành component riêng để tránh re-render toàn bộ danh sách
const MemoizedOrderItem = memo(({ item, selectedOrderCounter }: { item: any, selectedOrderCounter: string }) => (
  <View className="my-3">
    <OrderItem
      {...item}
      selectedOrderCounter={selectedOrderCounter}
    />
  </View>
));

// Footer component
const ListFooter = memo(({ 
  isFetchingNextPage, 
  hasNextPage, 
  isFetching, 
  hasItems 
}: { 
  isFetchingNextPage: boolean, 
  hasNextPage: boolean | undefined, 
  isFetching: boolean, 
  hasItems: boolean 
}) => {
  if (isFetchingNextPage) {
    return <ActivityIndicator color="blue" />;
  }
  
  if (!hasNextPage && !isFetchingNextPage && !isFetching && hasItems) {
    return <Text className="text-center text-xs text-gray-500">Danh sách đã hết</Text>;
  }
  
  return <View />;
});

// Loading component
const LoadingIndicator = memo(() => (
  <View className="text-center py-3">
    <ActivityIndicator className="text-gray-300" />
  </View>
));

// Error component
const ErrorMessage = memo(({ error }: { error: string }) => (
  <View className="mt-2">
    <SectionAlert variant="danger">
      <Text>Error: {error}</Text>
    </SectionAlert>
  </View>
));

// Empty component
const EmptyComponent = memo(({ isFetching }: { isFetching: boolean }) => {
  if (!isFetching) {
    return (
      <View className="mt-3">
        <Empty />
      </View>
    );
  }
  return null;
});

const OrderList = () => {
  // References
  const flatListRef = useRef<FlatList>(null);
  const isInitialRender = useRef(true);
  const isManualRefreshRef = useRef(false);
  const prevParamsRef = useRef<any>(null);

  const { mutate: refreshToken } = useRefreshToken((data) => {
    setToken(data?.data?.zas || '');
    removeItem('ip');
    setTimeout(() => {
      setUserInfo({
        ...userInfo,
        ...data?.data
      });
      setTimeout(() => {
        setUser({
          ...userInfo,
          ...data?.data
        });
        setLoading(false);
      }, 200);
    }, 1000);
  });
  
  // State from store
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const deliveryType = useOrders.use.deliveryType();
  const operationType = useOrders.use.operationType();
  const fromScanQrCode = useOrders.use.fromScanQrCode();
  const userInfo = useAuth.use.userInfo();
  const { storeCode = '' } = userInfo || {};

  // Add verification for store code
  const [isStoreReady, setIsStoreReady] = useState(!!storeCode);

  // Check if store code is available
  useEffect(() => {
    if (storeCode && !isStoreReady) {
      setIsStoreReady(true);
      console.log("Store code is now available:", storeCode);
    }
  }, [storeCode, isStoreReady]);

  // State
  const [isRefreshIndicatorVisible, setIsRefreshIndicatorVisible] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

  // Memoize search params
  const params = useMemo(() =>{
    
    return ({
      status: fromScanQrCode ? 'ALL' : selectedOrderCounter,
      deliveryType: fromScanQrCode ? null : deliveryType,
      operationType: fromScanQrCode ? null : operationType,
      storeCode: storeCode || '',
    })
  }, [selectedOrderCounter, deliveryType, operationType, storeCode, fromScanQrCode]);

  // Check if params have changed
  const haveParamsChanged = useCallback(() => {
    if (!prevParamsRef.current) return true;
    
    // Only compare relevant fields for reload
    const prevParams = prevParamsRef.current;
    return (
      prevParams.status !== params?.status ||
      prevParams.deliveryType !== params?.deliveryType ||
      prevParams.operationType !== params?.operationType ||
      prevParams.storeCode !== params?.storeCode
    );
  }, [params]);

  // Update prevParams ref 
  useEffect(() => {
    prevParamsRef.current = params;
  }, [params]);

  // Data query - Only run when storeCode exists
  const {
    data: ordersResponse,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    hasPreviousPage,
    isSuccess,
    isPending
  } = useSearchOrders(
    // Only pass params when storeCode exists to prevent unnecessary API calls
    isStoreReady && storeCode ? params : undefined
  );

  const orderList = useMemo(() => ordersResponse?.pages || [], [ordersResponse?.pages]);
  const hasItems = orderList.length > 0;
  const hasError = !!(ordersResponse as any)?.error;
  const isLoading = (!hasPreviousPage && isPending && !isManualRefreshRef.current) || !isStoreReady;

  // Reset scan QR flag after successful fetch
  useEffect(() => {
    if (isSuccess && fromScanQrCode) {
      setFromScanQrCode(false);
    }
  }, [isSuccess, fromScanQrCode]);

  // First page reset function - memoized
  const goFirstPage = useCallback(async () => {
    // Only reset and refetch if storeCode exists
    if (!storeCode) {
      console.log("[Orders] Cannot fetch without storeCode");
      return Promise.resolve();
    }

    await queryClient.setQueryData(['searchOrders', params], () => ({
      pages: [],
      pageParams: 1,
    }));
    return refetch();
  }, [params, refetch, storeCode]);

  // Reset page on filter changes
  useEffect(() => {
    if (!isInitialRender.current && haveParamsChanged() && storeCode) {
      isManualRefreshRef.current = false;
      goFirstPage();
    } else {
      isInitialRender.current = false;
    }
  }, [selectedOrderCounter, deliveryType, operationType, goFirstPage, haveParamsChanged, storeCode]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialRender.current && storeCode) {
        refetch();
      }
      return () => {};
    }, [refetch, storeCode])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    refreshToken();
    // Only perform refresh if storeCode exists
    if (!storeCode) {
      console.log("[Orders] Cannot refresh without storeCode");
      return;
    }

    isManualRefreshRef.current = true;
    setIsRefreshIndicatorVisible(true);
    
    Promise.all([
      goFirstPage(),
      queryClient.invalidateQueries({ 
        queryKey: ['getOrderStatusCounters', operationType, storeCode] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['getOrderDeliveryTypeCounters', operationType, storeCode, selectedOrderCounter] 
      })
    ]).finally(() => {
      // Hide refresh indicator after all queries complete
      setTimeout(() => setIsRefreshIndicatorVisible(false), 500);
    });
  }, [goFirstPage, operationType, storeCode, selectedOrderCounter]);

  // Handle end reached - load more data
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage && storeCode) {
      isManualRefreshRef.current = false;
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage, storeCode]);

  // Memoize item renderer to prevent unnecessary re-renders
  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    // Fast path: Chỉ render các items gần viewport
    // if (isItemInViewport(index)) {
      return (
        <MemoizedOrderItem 
          item={item} 
          selectedOrderCounter={selectedOrderCounter} 
        />
      );
    // }
    
    // Nếu item ở xa viewport, render placeholder hoặc item đơn giản hơn
    return (
      <View className="my-3 h-24 bg-gray-50 rounded-md" 
            style={{height: getItemLayout(null, index).length}} />
    );
  }, [selectedOrderCounter, visibleIndices]);

  // Optimize list performance with getItemLayout
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 120, // Estimated item height
    offset: 120 * index,
    index,
  }), []);

  // Optimize key extraction
  const keyExtractor = useCallback((item: any, index: number) => `${item.code}-${index}`, []);

  // Thêm hàm này để theo dõi các items đang hiển thị
  const isItemInViewport = useCallback((index: number) => {
    return visibleIndices.includes(index) || 
           visibleIndices.includes(index - 1) || 
           visibleIndices.includes(index + 1);
  }, [visibleIndices]);

  // Thêm prop onViewableItemsChanged cho FlatList
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any }) => {
    setVisibleIndices(viewableItems.map((item: any) => item.index));
  }, []);

  // Cấu hình viewability
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 300,
  }).current;

  // Conditional rendering based on state
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (hasError) {
    return <ErrorMessage error={(ordersResponse as any)?.error} />;
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
            refreshing={isRefreshIndicatorVisible}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={<EmptyComponent isFetching={isFetching} />}
        data={orderList}
        onEndReachedThreshold={0.3}
        onEndReached={handleEndReached}
        ListFooterComponent={
          <ListFooter 
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            isFetching={isFetching}
            hasItems={hasItems}
          />
        }
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // getItemLayout={getItemLayout}
        // removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={75}
        windowSize={3}
        // progressViewOffset={10}
        // maintainVisibleContentPosition={{
        //   minIndexForVisible: 0,
        //   autoscrollToTopThreshold: 3
        // }}
        // legacyImplementation={Platform.OS === 'android'}
        // onViewableItemsChanged={handleViewableItemsChanged}
        // viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

export default memo(OrderList);
