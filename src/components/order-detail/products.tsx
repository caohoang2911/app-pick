import clsx from 'clsx';
import { useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import {
  setCurrentId,
  setInitOrderPickProducts,
  setKeyword,
  setOrderDetail,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { barcodeCondition, getOrderPickProductsFlat, handleScanBarcode } from '~/src/core/utils/order-bag';
import { OrderStatus } from '~/src/types/order';
import { Product, ProductItemGroup } from '~/src/types/product';
import Empty from '../shared/Empty';
import OrderPickProduct from './product';
import ProductCombo from './product-combo';
import ProductGift from './product-gift';
import UserNote from './user-note';
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
  isLast,
  pickingBarcode,
  statusOrder,
  indexBarcodeWithoutPickedTime,
}: { 
  item: Product | ProductItemGroup | any, 
  isLast: boolean,
  pickingBarcode: string,
  statusOrder?: string,
  indexBarcodeWithoutPickedTime?: number,
}) => {
  const renderProduct = () => {
    if(item.type === "COMBO" && 'elements' in item) {
      return <ProductCombo statusOrder={statusOrder || ''} indexBarcodeWithoutPickedTime={indexBarcodeWithoutPickedTime} pickingBarcode={pickingBarcode} combo={item as ProductItemGroup} />;
    }
    if(item.type === "GIFT_PACK" && 'elements' in item) {
      return <ProductGift statusOrder={statusOrder || ''} indexBarcodeWithoutPickedTime={indexBarcodeWithoutPickedTime} pickingBarcode={pickingBarcode} giftPack={item as ProductItemGroup} />;
    }
    return <OrderPickProduct statusOrder={statusOrder || ''} indexBarcodeWithoutPickedTime={indexBarcodeWithoutPickedTime} pickingBarcode={pickingBarcode} {...(item.elements?.[0] as Product)} />;
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
  
  const keyword = useOrderPick.use.keyword();
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
  const flatListRef = useRef<FlatList>(null);
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
  const filteredProducts = orderPickProducts;
  // const filteredProducts = useMemo(() => {
  //   if (!keyword || !orderPickProducts) return orderPickProducts;

  //   return orderPickProducts.filter((products: any) => {
  //     return products?.elements?.some((product: Product) => {
  //       const normalizedKeyword = stringUtils.removeAccents(keyword.toLowerCase());
  //       const normalizedName = stringUtils.removeAccents((product.name || '').toLowerCase());
  //       const normalizedBarcode = (product.barcode || '').toLowerCase() + (product.baseBarcode || '').toLowerCase();
        
  //       return normalizedName.includes(normalizedKeyword) || normalizedBarcode.includes(normalizedKeyword);
  //     });
  //   });
  // }, [keyword, orderPickProducts]);

  useEffect(() => {
    if(!keyword) return;

    const keywordUpper = keyword.toUpperCase();

    const productBarcode = orderPickProductsFlat?.find((product: Product) => {
      if (keywordUpper.length >= 6) {
        const lastSixDigits = keywordUpper.slice(-6);
        return product?.refBarcodes?.some(refBarcode => 
          refBarcode.endsWith(lastSixDigits) || 
          refBarcode.includes(lastSixDigits)
        );
      } 

      return barcodeCondition(keywordUpper, product?.refBarcodes);
    });
    if(productBarcode) {
      Keyboard.dismiss();
      const indexOfCodeScanned = handleScanBarcode({
        orderPickProductsFlat,
        currentId: productBarcode?.id,
        isEditManual: false,
        barcode: productBarcode?.barcode || '',
      });
      
      if(indexOfCodeScanned != -1) {
        const currentProduct = orderPickProductsFlat?.[indexOfCodeScanned];
    
        if(currentProduct) {
          setSuccessForBarcodeScan(productBarcode?.barcode || '');
          setCurrentId(currentProduct?.id)
          toggleShowAmountInput(true, currentProduct?.id)
          setKeyword("")
        }
      }
    }
    
  }, [keyword, orderPickProducts, orderPickProductsFlat, handleScanBarcode]);


  // Callback cho việc render item
  const renderItem = useCallback(({ item, index, statusOrder, pickingBarcode }: { item: any, index: number, statusOrder?: string, pickingBarcode: string }) => {
    const isLast = index === (filteredProducts?.length || 0) - 1;

    const indexBarcodeWithoutPickedTime = orderPickProductsFlat?.findIndex((item: Product) => {
      return item.barcode === pickingBarcode && !item.pickedTime;
    })

    return <ProductItem statusOrder={statusOrder} item={item} isLast={isLast} pickingBarcode={pickingBarcode} indexBarcodeWithoutPickedTime={indexBarcodeWithoutPickedTime} />;
  }, [filteredProducts?.length, orderPickProductsFlat]);

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
  const isEmpty = isLoaded && (!filteredProducts || filteredProducts.length === 0);

  const getPickingBarcode = useMemo(() => {
    return orderPickProductsFlat.find((product: Product) => {
      return !product.pickedTime;
    })?.barcode || '';
  }, [orderPickProductsFlat]);

  const getBarcodeIndexFilteredProducts = useMemo(() => {
    return filteredProducts.findIndex((product: any) => {
      return product.elements?.some((element: Product) => {
        return element.barcode === getPickingBarcode && !element.pickedTime;
      });
    });
  }, [filteredProducts]);

  
  useEffect(() => {
    if(!getPickingBarcode) return;

    const index = getBarcodeIndexFilteredProducts;
    if(index === -1) return;

    setTimeout(() => {
      if (flatListRef.current && index >= 0 && index < (filteredProducts?.length || 0)) {
        try {
          flatListRef.current.scrollToIndex({
            animated: true,
            index,
            viewPosition: 0.5,
          });
        } catch (error) {
          console.log(JSON.stringify(error))
        }
      }
    }, 100);
  }, [getPickingBarcode, getBarcodeIndexFilteredProducts, filteredProducts]);

  // Render component loading
  if (isPending || isFetching || isLoading) {
    return <LoadingIndicator />;
  }

  // Window dimensions
  const { height } = Dimensions.get('window');
  const itemHeight = 200; // Ước tính chiều cao trung bình
  const visibleItems = Math.ceil(height / itemHeight);

  return (
    <View style={{ flex: 1 }} onLayout={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: false })}>
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
        ListFooterComponent={<View style={{ height: 20 }} />}
        ListHeaderComponent={<UserNote />}
        data={filteredProducts as Array<any>}
        ListEmptyComponent={isEmpty ? <EmptyProductList /> : <View style={{ height: 20 }} />}
        renderItem={({ item, index }) => renderItem({ item, index, statusOrder: data?.data?.header?.status as string, pickingBarcode:  getPickingBarcode })}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        removeClippedSubviews={false}
        initialNumToRender={visibleItems}
        maxToRenderPerBatch={visibleItems}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
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