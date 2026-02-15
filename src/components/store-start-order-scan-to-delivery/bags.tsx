import { useLocalSearchParams } from 'expo-router';
import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { transformOrderBags } from '~/src/core/utils/order-bag';
import { OrderBagLabel, OrderBagType } from '~/src/types/order-bag';
import Box from '../Box';
import BagType from './bag-type';
import { useOrderDetailStore } from '~/src/core/store/order-detail';
import { useStoreStartOrderScanToDelivery } from '~/src/core/store/store-start-order-scan-to-delivery';

// Memoize BagType để tránh re-render không cần thiết
const MemoizedBagType = memo(BagType);

const Empty = () => {
  return (
    <Box>
      <Text className="text-center text-gray-500">
        Không có tem. Vui lòng set kích thước & In tem
      </Text>
    </Box>
  );
};

// Component chính
const Bags = memo(() => {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const bagLabels = useOrderDetailStore((s) =>
    code ? s.orderDetails[code]?.header?.bagLabels : undefined,
  );
  const orderBags = useStoreStartOrderScanToDelivery.use.orderBags();

  // orderBags được đồng bộ từ parent qua transformBagsData (có name, isDone)

  // Memoize transformed bags để tránh tính toán lại
  const orderBagTransform = useMemo(() => {
    if (!orderBags || orderBags.length === 0)
      return { DRY: [], FROZEN: [], FRESH: [] };
    return transformOrderBags(orderBags);
  }, [orderBags]);

  // Memoize các props để tránh re-render không cần thiết
  const dryBagProps = useMemo(
    () => ({
      title: OrderBagLabel.DRY,
      type: OrderBagType.DRY,
      bagLabels: orderBagTransform.DRY,
    }),
    [orderBagTransform.DRY],
  );

  const frozenBagProps = useMemo(
    () => ({
      title: OrderBagLabel.FROZEN,
      type: OrderBagType.FROZEN,
      bagLabels: orderBagTransform.FROZEN,
    }),
    [orderBagTransform.FROZEN],
  );

  const freshBagProps = useMemo(
    () => ({
      title: OrderBagLabel.FRESH,
      type: OrderBagType.FRESH,
      bagLabels: orderBagTransform.FRESH,
    }),
    [orderBagTransform.FRESH],
  );

  // Early return nếu không có dữ liệu
  if (!orderBags?.length)
    return (
      <>
        <Empty />
      </>
    );

  // Thêm shouldRender để tránh render các BagType không có dữ liệu
  const shouldRenderDry = orderBagTransform.DRY.length > 0;
  const shouldRenderFrozen = orderBagTransform.FROZEN.length > 0;
  const shouldRenderFresh = orderBagTransform.FRESH.length > 0;

  // Nếu không có bag nào, return null
  if (!shouldRenderDry && !shouldRenderFrozen && !shouldRenderFresh)
    return <Empty />;

  return (
    <Box>
      <View className="flex flex-row gap-2 justify-end">
        <View className="pb-3 rounded-md flex flex-row gap-2">
          <Text className="text-gray-500">Tổng</Text>
          <Text className="font-medium">{bagLabels?.length} túi</Text>
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

export default memo(Bags);
