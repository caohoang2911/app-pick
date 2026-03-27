import clsx from 'clsx';
import { useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  InteractionManager,
  Keyboard,
  ListRenderItemInfo,
  Platform,
  View,
} from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { queryClient } from '~/src/api/shared';
import {
  setCurrentId,
  setInitOrderPickProducts,
  setKeyword,
  setLastScannedId,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import {
  barcodeCondition,
  handleScanBarcode,
} from '~/src/core/utils/order-bag';
import { Product, ProductItemGroup } from '~/src/types/product';
import Empty from '../shared/Empty';
import OrderPickProduct from './product';
import ProductCombo from './product-combo';
import ProductGift from './product-gift';
import UserNote from './user-note';

const EmptyProductList = () => (
  <View className="mt-3">
    <Empty />
  </View>
);

// Memoize các component render item
const ProductItem = memo(
  ({
    item,
    isLast,
    pickingBarcode,
    statusOrder,
  }: {
    item: Product | ProductItemGroup | any;
    isLast: boolean;
    pickingBarcode: string;
    statusOrder?: string;
  }) => {
    const renderProduct = () => {
      if (item.type === 'COMBO' && 'elements' in item) {
        return (
          <ProductCombo
            statusOrder={statusOrder || ''}
            pickingBarcode={pickingBarcode}
            combo={item as ProductItemGroup}
          />
        );
      }
      if (item.type === 'GIFT_PACK' && 'elements' in item) {
        return (
          <ProductGift
            statusOrder={statusOrder || ''}
            pickingBarcode={pickingBarcode}
            giftPack={item as ProductItemGroup}
          />
        );
      }
      return (
        <OrderPickProduct
          statusOrder={statusOrder || ''}
          pickingBarcode={pickingBarcode}
          {...(item.elements?.[0] as Product)}
        />
      );
    };

    return (
      <View className={clsx('px-4 mb-4', { 'mb-10': isLast })}>
        {renderProduct()}
      </View>
    );
  },
);

// Component chính
const OrderPickProducts = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const keyword = useOrderPick.use.keyword();
  const orderDetail = useOrderPick.use.orderDetail();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Keep pull-to-refresh but delegate to root query cache
  const handleRefresh = useCallback(async () => {
    if (!code) return;
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries({
        queryKey: ['orderDetail', code],
        exact: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [code]);

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = useOrderPickProductsFlat();
  const lastScannedId = useOrderPick.use.lastScannedId();
  const flatListRef = useRef<FlatList>(null);

  // Khởi tạo products từ orderDetail đã có sẵn ở store (set từ màn root)
  useEffect(() => {
    const itemGroups = orderDetail?.delivery?.itemGroups;
    if (itemGroups) {
      const tempArr = Object.values(itemGroups).map((item: any) => item);
      setInitOrderPickProducts([...tempArr] as never[]);
    }
  }, [orderDetail?.delivery?.itemGroups]);

  const filteredProducts = orderPickProducts;

  useEffect(() => {
    if (!keyword) return;

    const keywordUpper = keyword.toUpperCase();

    const productBarcode = orderPickProductsFlat?.find((product: Product) => {
      if (keywordUpper.length >= 6) {
        const lastSixDigits = keywordUpper.slice(-6);
        return product?.refBarcodes?.some(
          (refBarcode) =>
            refBarcode?.endsWith(lastSixDigits) ||
            refBarcode?.includes(lastSixDigits),
        );
      }

      return barcodeCondition(keywordUpper, product?.refBarcodes);
    });
    if (productBarcode) {
      Keyboard.dismiss();
      const indexOfCodeScanned = handleScanBarcode({
        orderPickProductsFlat,
        currentId: productBarcode?.id,
        isEditManual: false,
        barcode: productBarcode?.barcode || '',
      });

      if (indexOfCodeScanned != -1) {
        const currentProduct = orderPickProductsFlat?.[indexOfCodeScanned];

        if (currentProduct) {
          setSuccessForBarcodeScan(productBarcode?.barcode || '');
          setCurrentId(currentProduct?.id);
          setLastScannedId(currentProduct?.id ?? null);
          toggleShowAmountInput(true, currentProduct?.id);
          setKeyword('');
        }
      }
    }
  }, [
    keyword,
    orderPickProducts,
    orderPickProductsFlat,
    handleScanBarcode,
    setSuccessForBarcodeScan,
    setCurrentId,
    setLastScannedId,
    toggleShowAmountInput,
    setKeyword,
  ]);

  // Key extractor tối ưu
  const keyExtractor = useCallback((item: any, index: number) => {
    // Ensure unique keys for all item types
    if (item.code) {
      return `${item.code}_${index}`;
    }
    if (item.id) {
      return `${item.id}_${index}`;
    }
    if (item.barcode) {
      return `${item.barcode}_${index}`;
    }
    return `item_${index}`;
  }, []);

  // Handle scroll failure with enhanced error handling
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      console.warn('scrollToIndexFailed:', info);

      if (!flatListRef.current) {
        console.warn('FlatList ref not available in scrollToIndexFailed');
        return;
      }

      try {
        // Tính toán scroll offset dựa trên số liệu thống kê
        const offset = Math.max(0, info.averageItemLength * info.index);
        flatListRef.current.scrollToOffset({ offset, animated: true });

        // Thử lại sau một khoảng thời gian ngắn với error handling
        setTimeout(() => {
          if (
            flatListRef.current &&
            info.index >= 0 &&
            info.index < (filteredProducts?.length || 0)
          ) {
            try {
              flatListRef.current.scrollToIndex({
                animated: true,
                index: info.index,
                viewPosition: 0.5,
              });
            } catch (retryError) {
              console.warn('Retry scrollToIndex failed:', retryError);
              // Final fallback - use scrollToOffset with more precise calculation
              const finalOffset = Math.max(
                0,
                info.averageItemLength * info.index,
              );
              try {
                flatListRef.current.scrollToOffset({
                  offset: finalOffset,
                  animated: true,
                });
              } catch (fallbackError) {
                console.warn(
                  'Final scrollToOffset fallback failed:',
                  fallbackError,
                );
              }
            }
          }
        }, 100);
      } catch (error) {
        console.warn('Initial scrollToOffset failed:', error);
      }
    },
    [filteredProducts?.length],
  );

  const hasOrderDetail = !!orderDetail?.delivery;
  const isEmpty =
    !hasOrderDetail && (!filteredProducts || filteredProducts.length === 0);

  const getPickingBarcode = useMemo(() => {
    return (
      orderPickProductsFlat.find((product: Product) => {
        return !product.pickedTime;
      })?.barcode || ''
    );
  }, [orderPickProductsFlat]);

  const filteredProductsLength = filteredProducts?.length ?? 0;
  const statusOrder = orderDetail?.header?.status as string | undefined;

  const listRenderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<any>) => {
      const isLast = index === filteredProductsLength - 1;

      return (
        <ProductItem
          statusOrder={statusOrder}
          item={item}
          isLast={isLast}
          pickingBarcode={getPickingBarcode}
        />
      );
    },
    [filteredProductsLength, getPickingBarcode, statusOrder],
  );

  const scrollTargetIndex = useMemo(() => {
    if (lastScannedId) {
      const idx = filteredProducts.findIndex((product: any) => {
        return product.elements?.some(
          (element: Product) => element.id === lastScannedId,
        );
      });
      if (idx !== -1) return idx;
    }

    return -1;
  }, [filteredProducts, lastScannedId]);

  useEffect(() => {
    const index = scrollTargetIndex;
    if (index === -1) return;

    const dataLength = filteredProducts?.length || 0;
    if (dataLength === 0) {
      if (__DEV__) {
        console.warn('No filtered products available for scrolling');
      }
      return;
    }

    let cancelled = false;

    InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        if (flatListRef.current && index >= 0 && index < dataLength) {
          try {
            flatListRef.current.scrollToIndex({
              animated: true,
              index,
              viewPosition: 0.5,
            });
          } catch (error) {
            if (__DEV__) {
              console.warn('scrollToIndex failed in useEffect:', error);
            }
            const estimatedOffset = Math.max(0, index * 200);
            try {
              flatListRef.current.scrollToOffset({
                offset: estimatedOffset,
                animated: true,
              });
            } catch (fallbackError) {
              if (__DEV__) {
                console.warn('scrollToOffset fallback failed:', fallbackError);
              }
            }
          }
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [filteredProducts, scrollTargetIndex]);

  const { height } = Dimensions.get('window');
  const itemHeight = 200;
  const visibleItems = Math.ceil(height / itemHeight);
  const initialNumToRender = Math.min(Math.max(visibleItems, 4), 10);
  const maxToRenderPerBatch = Math.min(6, initialNumToRender);

  const listHeader = useMemo(
    () => (
      <View className="flex flex-col gap-2">
        <UserNote />
      </View>
    ),
    [],
  );

  const listFooter = useMemo(() => <View style={{ height: 20 }} />, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        data={filteredProducts || []}
        ListEmptyComponent={
          isEmpty ? <EmptyProductList /> : <View style={{ height: 20 }} />
        }
        renderItem={listRenderItem}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

// Đặt displayName để dễ debug
OrderPickProducts.displayName = 'OrderPickProducts';

export default memo(OrderPickProducts);
