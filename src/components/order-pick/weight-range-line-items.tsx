import { PRODUCT_PICKED_ERROR_TYPES } from '@/core/constants/product';
import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  setScanMoreProduct,
  toggleScanQrCodeProduct,
} from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import PickMoreScanButton from './pick-more-scan-button';
import { parseOrderQuantityConversionUnit } from './unit-text';

export function roundWeightKg(value: number): number {
  return Math.round(Number(value) * 1000) / 1000;
}

/** [2.6, 3.4, 3.6] → 9.6 */
export function sumWeightRangeItemKGs(items: number[] = []): number {
  return roundWeightKg(items.reduce((sum, w) => sum + Number(w), 0));
}

type WeightRangeItemKGsStored = number[] | Record<string, number>[] | undefined;

/** Đọc từ API — hỗ trợ cả format mới [2.5, 2.6] và legacy [{ "1": 2.5 }, ...]. */
export function parseWeightRangeItemKGs(
  stored: WeightRangeItemKGsStored,
): number[] {
  if (!stored?.length) return [];
  if (typeof stored[0] === 'number') {
    return (stored as number[]).map(roundWeightKg);
  }
  return (stored as Record<string, number>[]).map((item) =>
    roundWeightKg(Object.values(item)[0] ?? 0),
  );
}

export function normalizeWeightRangeItemKGs(items: number[] = []): number[] {
  return items.map(roundWeightKg);
}

/** Số lượng đặt theo đơn vị quy đổi (vd. 4 Bắp), mỗi lần quét = 1 item. */
export function getWeightRangeOrderQuantity(
  product?: Pick<Product, 'orderQuantity' | 'orderQuantityConversion'>,
): number {
  return Number(
    product?.orderQuantityConversion?.quantity ?? product?.orderQuantity ?? 0,
  );
}

/** h-11 */
const WEIGHT_RANGE_ITEM_HEIGHT = 44;
/** gap-2 */
const WEIGHT_RANGE_ITEM_GAP = 8;
/** Hiển thị tối đa 4 item, từ item thứ 5 scroll trong vùng cố định. */
const WEIGHT_RANGE_MAX_VISIBLE_ITEMS = 4;
export const WEIGHT_RANGE_LIST_MAX_HEIGHT =
  WEIGHT_RANGE_ITEM_HEIGHT * WEIGHT_RANGE_MAX_VISIBLE_ITEMS +
  WEIGHT_RANGE_ITEM_GAP * (WEIGHT_RANGE_MAX_VISIBLE_ITEMS - 1);

type Props = {
  values: { weightRangeItemKGs?: number[]; pickedErrorType?: string };
  setFieldValue: (field: string, value: unknown) => void;
  orderQuantityConversion?: Product['orderQuantityConversion'];
};

const WeightRangeLineItems = memo(function WeightRangeLineItems({
  values,
  setFieldValue,
  orderQuantityConversion,
}: Props) {
  const editable =
    values?.pickedErrorType !== PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK;

  const items: number[] = useMemo(
    () => values?.weightRangeItemKGs ?? [],
    [values?.weightRangeItemKGs],
  );

  const totalWeight = useMemo(() => sumWeightRangeItemKGs(items), [items]);

  useEffect(() => {
    setFieldValue('pickedQuantity', totalWeight);
  }, [totalWeight, setFieldValue]);

  const handleQRScan = useCallback(() => {
    if (!editable) return;
    toggleScanQrCodeProduct(true);
    setScanMoreProduct(true);
  }, [editable]);

  const handleDelete = useCallback(
    (index: number) => {
      setFieldValue(
        'weightRangeItemKGs',
        items.filter((_, i) => i !== index),
      );
    },
    [items, setFieldValue],
  );

  const unitName = useMemo(() => {
    if (!orderQuantityConversion?.unit) return '';
    return (
      parseOrderQuantityConversionUnit(orderQuantityConversion.unit)?.name ?? ''
    );
  }, [orderQuantityConversion?.unit]);

  const renderItem = (weight: number, index: number) => (
    <View
      key={index}
      className="flex-row items-center bg-purple-50 rounded-lg px-3 h-11"
    >
      <Text
        className="flex-1 shrink text-sm font-medium text-gray-700"
        numberOfLines={1}
      >
        {`1 x ${unitName}  `}
        <Text className="font-bold text-colorPrimary">{weight}KG</Text>
      </Text>
      {editable && (
        <Pressable
          onPress={() => handleDelete(index)}
          hitSlop={8}
          className="ml-2 p-1"
        >
          <Feather name="trash-2" size={18} color="#7c3aed" />
        </Pressable>
      )}
    </View>
  );

  return (
    <View className="flex-row items-start gap-3">
      <View className="flex-1">
        {items.length === 0 ? (
          <Text className="text-sm text-gray-400 mt-3">
            Bấm Pick thêm để quét từng item.
          </Text>
        ) : (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: WEIGHT_RANGE_LIST_MAX_HEIGHT }}
            contentContainerStyle={{ gap: WEIGHT_RANGE_ITEM_GAP }}
          >
            {[...items].map(renderItem)}
          </ScrollView>
        )}
      </View>

      <PickMoreScanButton onPress={handleQRScan} disabled={!editable} />
    </View>
  );
});

export default WeightRangeLineItems;
