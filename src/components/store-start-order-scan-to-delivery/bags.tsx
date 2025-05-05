import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import { setOrderBags, useOrderScanToDelivery } from '~/src/core/store/order-scan-to-delivery';
import { transformOrderBags } from '~/src/core/utils/order-bag';
import { OrderBagLabel, OrderBagType } from '~/src/types/order-bag';
import Box from '../Box';
import BagType from './bag-type';
import { setStoreStartOrderBags, useStoreStartOrderScanToDelivery } from '~/src/core/store/store-start-order-scan-to-delivery';

// Memoize BagType để tránh re-render không cần thiết
const MemoizedBagType = memo(BagType);

// Component chính
const Bags = memo(() => {
  // State và refs
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Lấy dữ liệu từ store
  const orderInvoice = useStoreStartOrderScanToDelivery.use.orderDetail();
  const orderBags = useStoreStartOrderScanToDelivery.use.orderBags();
  
  // Extract data
  const bagLabels = orderInvoice?.header?.bagLabels || [];
  
  // Khởi tạo orderBags một lần duy nhất khi bagLabels thay đổi
  useEffect(() => {
    if (bagLabels?.length > 0) {
      // Tránh set lại nếu bagLabels không thay đổi
      const initializedBags = bagLabels.map((bag: any) => ({ ...bag, isDone: false }));
      setStoreStartOrderBags(initializedBags);
      setIsInitialized(true);
    }
  }, [bagLabels]);
  
  // Memoize transformed bags để tránh tính toán lại
  const orderBagTransform = useMemo(() => {
    if (!orderBags || orderBags.length === 0) return { DRY: [], FROZEN: [], FRESH: [] };
    return transformOrderBags(orderBags);
  }, [orderBags]);
  
  // Memoize các props để tránh re-render không cần thiết
  const dryBagProps = useMemo(() => ({
    title: OrderBagLabel.DRY,
    type: OrderBagType.DRY,
    bagLabels: orderBagTransform.DRY
  }), [orderBagTransform.DRY]);
  
  const frozenBagProps = useMemo(() => ({
    title: OrderBagLabel.FROZEN,
    type: OrderBagType.FROZEN,
    bagLabels: orderBagTransform.FROZEN
  }), [orderBagTransform.FROZEN]);
  
  const freshBagProps = useMemo(() => ({
    title: OrderBagLabel.FRESH,
    type: OrderBagType.FRESH,
    bagLabels: orderBagTransform.FRESH
  }), [orderBagTransform.FRESH]);
  
  // Early return nếu không có dữ liệu
  if (!isInitialized || !orderBags || orderBags.length === 0) return null;
  
  // Thêm shouldRender để tránh render các BagType không có dữ liệu
  const shouldRenderDry = orderBagTransform.DRY.length > 0;
  const shouldRenderFrozen = orderBagTransform.FROZEN.length > 0;
  const shouldRenderFresh = orderBagTransform.FRESH.length > 0;
  
  // Nếu không có bag nào, return null
  if (!shouldRenderDry && !shouldRenderFrozen && !shouldRenderFresh) return null;
  
  return (
    <Box>
      <View className="flex flex-row gap-2 justify-end">  
        <View className='pb-3 rounded-md flex flex-row gap-2'>
          <Text className='text-gray-500'>Tổng</Text>
          <Text className='font-medium'>{bagLabels?.length} túi</Text>
        </View>
      </View>
      <View className="flex flex-col gap-4">
        {shouldRenderDry && <MemoizedBagType {...dryBagProps} />}
        {shouldRenderFrozen && <MemoizedBagType {...frozenBagProps} />}
        {shouldRenderFresh && <MemoizedBagType {...freshBagProps} />}
      </View>
    </Box>
  );
});

// Đặt displayName để dễ debug
Bags.displayName = 'Bags';

export default Bags;
