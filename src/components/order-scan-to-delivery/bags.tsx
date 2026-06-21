import { useLocalSearchParams } from 'expo-router';
import { toUpper } from 'lodash';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import {
  resetOrderBags,
  setOrderBags,
  useOrderScanToDelivery,
} from '~/src/core/store/order-scan-to-delivery';
import {
  OrderBagItem,
  OrderBagLabel,
  OrderBagType,
} from '~/src/types/order-bags';
import Box from '../Box';
import BagType from './bag-type';

const MemoizedBagType = memo(BagType);

export type OrderScanBagsProps = {
  /**
   * Truyền từ màn đã chờ load order detail — tránh race với query trong Bags
   * (orderDetail rỗng `{}` trước khi cache khớp khiến danh sách túi trống).
   */
  bagLabels?: OrderBagItem[] | null;
};

const Empty = () => {
  return (
    <Box>
      <Text className="text-center text-gray-500">
        Không có tem. Vui lòng set kích thước & In tem
      </Text>
    </Box>
  );
};

const normBagType = (t: unknown) => toUpper(String(t ?? ''));

function partitionBagsByType(orderBags: OrderBagItem[]) {
  const dry: OrderBagItem[] = [];
  const frozen: OrderBagItem[] = [];
  const fresh: OrderBagItem[] = [];
  const other: OrderBagItem[] = [];
  for (const bag of orderBags) {
    const n = normBagType(bag.type);
    if (n === 'DRY') dry.push(bag);
    else if (n === 'FROZEN') frozen.push(bag);
    else if (n === 'FRESH') fresh.push(bag);
    else other.push(bag);
  }
  return { DRY: dry, FROZEN: frozen, FRESH: fresh, OTHER: other };
}

const Bags = memo(({ bagLabels: bagLabelsProp }: OrderScanBagsProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const { code } = useLocalSearchParams<{ code?: string }>();
  const { orderDetail } = useOrderDetailForCode(code);
  const bagLabelsFromQuery = orderDetail?.header?.bagLabels;
  const bagLabelsSource = bagLabelsProp ?? bagLabelsFromQuery;

  const orderBags = useOrderScanToDelivery.use.orderBags();

  useEffect(() => {
    if (code) {
      resetOrderBags();
      setIsInitialized(false);
    }
  }, [code]);

  useEffect(() => {
    if (bagLabelsSource && bagLabelsSource.length > 0) {
      const initializedBags = bagLabelsSource.map((bag) => ({
        ...bag,
        isDone: bag.isDone ?? false,
      }));
      setOrderBags(initializedBags);
      setIsInitialized(true);
    } else {
      setOrderBags([]);
      setIsInitialized(false);
    }
  }, [bagLabelsSource]);

  const orderBagTransform = useMemo(() => {
    if (!orderBags || orderBags.length === 0) {
      return { DRY: [], FROZEN: [], FRESH: [], OTHER: [] as OrderBagItem[] };
    }
    return partitionBagsByType(orderBags);
  }, [orderBags]);

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

  const otherBagProps = useMemo(
    () => ({
      title: 'Túi hàng',
      type: OrderBagType.DRY,
      bagLabels: orderBagTransform.OTHER,
    }),
    [orderBagTransform.OTHER],
  );

  const shouldRenderDry = orderBagTransform.DRY.length > 0;
  const shouldRenderFrozen = orderBagTransform.FROZEN.length > 0;
  const shouldRenderFresh = orderBagTransform.FRESH.length > 0;
  const shouldRenderOther = orderBagTransform.OTHER.length > 0;

  const hasAnySection =
    shouldRenderDry ||
    shouldRenderFrozen ||
    shouldRenderFresh ||
    shouldRenderOther;

  const totalCount = bagLabelsSource?.length ?? orderBags?.length ?? 0;

  if (
    !isInitialized ||
    !orderBags ||
    orderBags.length === 0 ||
    !hasAnySection
  ) {
    return <Empty />;
  }

  return (
    <Box>
      <View className="flex flex-row gap-2 justify-end">
        <View className="pb-3 rounded-md flex flex-row gap-2">
          <Text className="text-gray-500">Tổng</Text>
          <Text className="font-medium">{totalCount} túi</Text>
        </View>
      </View>
      <View className="flex flex-col gap-4">
        {shouldRenderDry && <MemoizedBagType {...dryBagProps} />}
        {shouldRenderFrozen && <MemoizedBagType {...frozenBagProps} />}
        {shouldRenderFresh && <MemoizedBagType {...freshBagProps} />}
        {shouldRenderOther && <MemoizedBagType {...otherBagProps} />}
      </View>
    </Box>
  );
});

Bags.displayName = 'Bags';

export default Bags;
