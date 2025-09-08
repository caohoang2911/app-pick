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
import { useRoleDriver } from '~/src/core/hooks/useRole';
import { removeItem } from '~/src/core/storage';
import { setToken, setUserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';
import { setFromScanQrCode, setSelectedOrderCounter, useOrders } from '~/src/core/store/orders';
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

// Component to handle default tab initialization based on user role
const DefaultTabInitializer = memo(() => {
  const isDriver = useRoleDriver();
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();

  useEffect(() => {
    if (isDriver) {
      setSelectedOrderCounter("ALL");
    } else if (!isDriver) {
      setSelectedOrderCounter('CONFIRMED');
    }
  }, [isDriver]);

  return null; // This component doesn't render anything
});

const OrderList = () => {
  // References
  const flatListRef = useRef<FlatList>(null);
  const isInitialRender = useRef(true);
  const isManualRefreshRef = useRef(false);
  const prevParamsRef = useRef<any>(null);

  const userInfo = useAuth.use.userInfo();

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
  const fromScanQrCode = useOrders.use.fromScanQrCode();

  const isDriver = useRoleDriver();

  // Initialize default tab based on user role
  useEffect(() => {
    if (isDriver ) {
      setSelectedOrderCounter("ALL");
    } else if (!isDriver) {
      setSelectedOrderCounter('CONFIRMED');
    }
  }, [isDriver]);

  // State
  const [isRefreshIndicatorVisible, setIsRefreshIndicatorVisible] = useState(false);

  // Memoize search params
  const params = useMemo(() =>{
    
    return ({
      status: fromScanQrCode ? 'ALL' : selectedOrderCounter,
      deliveryType: fromScanQrCode ? null : deliveryType,

    })
  }, [selectedOrderCounter, deliveryType, fromScanQrCode]);

  // Check if params have changed
  const haveParamsChanged = useCallback(() => {
    if (!prevParamsRef.current) return true;
    
    // Only compare relevant fields for reload
    const prevParams = prevParamsRef.current;
    return (
      prevParams.status !== params?.status ||
      prevParams.deliveryType !== params?.deliveryType
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
  } = useSearchOrders(params);

  const orderList = useMemo(() => ordersResponse?.pages || [], [ordersResponse?.pages]);
  const hasItems = orderList.length > 0;
  const hasError = !!(ordersResponse as any)?.error;
  const isLoading = (!hasPreviousPage && isPending && !isManualRefreshRef.current);

  // Reset scan QR flag after successful fetch
  useEffect(() => {
    if (isSuccess && fromScanQrCode) {
      setFromScanQrCode(false);
    }
  }, [isSuccess, fromScanQrCode]);

  // First page reset function - memoized
  const goFirstPage = useCallback(async () => {
    await queryClient.setQueryData(['searchOrders', params], () => ({
      pages: [],
      pageParams: 1,
    }));
    return refetch();
  }, [params, refetch]);

  // Reset page on filter changes
  useEffect(() => {
    if (!isInitialRender.current && haveParamsChanged()) {
      isManualRefreshRef.current = false;
      goFirstPage();
    } else {
      isInitialRender.current = false;
    }
  }, [selectedOrderCounter, deliveryType, goFirstPage, haveParamsChanged]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialRender.current) {
        refetch();
      }
      return () => {};
    }, [refetch])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    refreshToken();

    isManualRefreshRef.current = true;
    setIsRefreshIndicatorVisible(true);
    
    Promise.all([
      goFirstPage(),
      queryClient.invalidateQueries({ 
        queryKey: ['getOrderStatusCounters'] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['getOrderDeliveryTypeCounters', selectedOrderCounter] 
      })
    ]).finally(() => {
      // Hide refresh indicator after all queries complete
      setTimeout(() => setIsRefreshIndicatorVisible(false), 500);
    });
  }, [goFirstPage, selectedOrderCounter]);

  // Handle end reached - load more data
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      isManualRefreshRef.current = false;
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // Memoize item renderer to prevent unnecessary re-renders
  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    // Fast path: Chỉ render các items gần viewport
    return (
      <MemoizedOrderItem 
        item={item} 
        selectedOrderCounter={selectedOrderCounter} 
      />
    );
  }, [selectedOrderCounter]);

  // Optimize list performance with getItemLayout
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 120, // Estimated item height
    offset: 120 * index,
    index,
  }), []);

  // Optimize key extraction
  const keyExtractor = useCallback((item: any, index: number) => `${item.code}-${index}`, []);

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
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={75}
        windowSize={3}
      />
    </View>
  );
};

export default memo(OrderList);
