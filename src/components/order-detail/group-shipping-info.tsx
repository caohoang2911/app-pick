import Feather from '@expo/vector-icons/Feather';
import { Platform, StyleSheet, Text, View } from "react-native";
import { useOrderPick } from "~/src/core/store/order-pick";
import { formatCurrency } from "~/src/core/utils/number";
import { OrderDetail } from "~/src/types/order-detail";
import { Badge } from "../Badge";

import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { router, useGlobalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { cn } from '~/src/lib/utils';
import { colors } from "~/src/ui/colors";

function OrderGroups({
  groupShippingOrderCodes,
  groupShippingPickedStatues,
  code,
}: {
  groupShippingOrderCodes: string[];
  groupShippingPickedStatues?: {[key: string]: boolean};
  code: string;
}) {
  const ref = useRef<any>();
  const goTabSelected = useCallback((index: number) => {

    setTimeout(() => {
      ref.current?.scrollToIndex({
        animated: true,
        index: index || 0,
        viewPosition: 0.5,
      });
    }, 200);
  }, [])

  useEffect(() => {
    const index = groupShippingOrderCodes?.findIndex((item) => item === code);
    if(index !== -1) {
      goTabSelected(index);
    }
  }, [code])

  return (
    <FlatList
      className="mt-1"
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={groupShippingOrderCodes || []}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isOrderCodeSeleted = item === code;
        const isFirst = index === 0;
        const isLast = index === groupShippingOrderCodes?.length - 1;
        const isCompleted = groupShippingPickedStatues?.[item] || false;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              goTabSelected(index);
              router.setParams({ code: item });
            }}
          >
            <View
              className="py-1 border border-gray-200 rounded-md mx-1"
              style={{
                marginLeft: isFirst ? 0 : 4,
                marginRight: isLast ? 0 : 4,
                backgroundColor: isOrderCodeSeleted ? colors.blue[50] : 'transparent',
              }}
            >
              <View className="flex flex-row items-center px-2 gap-1">
                {isCompleted && (
                  <Feather name="check" size={16} color={colors.colorPrimary} />
                )}
                <Text
                  className={cn('text-center',{
                    'color-colorPrimary font-semibold': isOrderCodeSeleted,
                    'color-gray-500': !isOrderCodeSeleted,
                  })}
                >
                  {item}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      horizontal
    />
  );
}

export function GroupShippingInfo() {
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();

  const { code } = useGlobalSearchParams<{ code: string }>();

  const { header } = orderDetail || {};
  const { groupShippingCode, groupShippingOrderCodes, groupShippingTotalCODAmount, groupShippingPickedStatues } = header || {};

  const totalPicked = Object.values(groupShippingPickedStatues || {}).filter(Boolean).length;

  if(!groupShippingCode || !groupShippingOrderCodes?.length) return null;

  return (
    <View className="mt-3 p-2 px-3 bg-white" style={styles.box}>
      <View className="flex flex-row items-center gap-2 mb-2 justify-between">
        <View className="flex flex-row items-center gap-2">
          <Badge label={groupShippingCode} variant="warning" />
          <Badge label={`COD ${formatCurrency(groupShippingTotalCODAmount || 0, {unit: true})}`} variant="default" />
        </View>
        <Text className={cn({
          'text-gray-500': totalPicked !== groupShippingOrderCodes?.length,
          'text-blue-500': totalPicked === groupShippingOrderCodes?.length,
        })}>Đã pick: {totalPicked}/{groupShippingOrderCodes?.length} đơn</Text>
      </View>
      <OrderGroups
        groupShippingOrderCodes={groupShippingOrderCodes}
        code={code}
        groupShippingPickedStatues={groupShippingPickedStatues}
      />
    </View>
    )
}

const styles = StyleSheet.create({
  edit: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  box: {
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 9,
      },
    }),
  },
});
  