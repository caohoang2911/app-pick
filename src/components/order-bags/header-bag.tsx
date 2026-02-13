import { useLocalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React from 'react';
import { Text, View } from 'react-native';
import { ORDER_COUNTER_STATUS } from '@/core/constants/order';
import { useOrderBag } from '~/src/core/store/order-bag';
import { useOrderDetailStore } from '~/src/core/store/order-detail';
import { OrderDetailHeader } from '~/src/types/order-pick';
import { Badge } from '../Badge';

function HeaderBag() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const status = useOrderDetailStore((s) =>
    code
      ? (s.orderDetails[code]?.header as OrderDetailHeader)?.status
      : undefined,
  );

  const totalBagsCount = useOrderBag((s) => {
    const b = s.orderBags;
    return (
      (b?.DRY?.length || 0) + (b?.FRESH?.length || 0) + (b?.FROZEN?.length || 0)
    );
  });

  return (
    <View className="bg-white mx-4 px-4 py-3 flex flex-row justify-between rounded-md items-center gap-2">
      <View className="flex flex-row items-center gap-2">
        <Text className="text-base text-colorPrimary font-semibold">
          {code}
        </Text>
        <Badge
          label={ORDER_COUNTER_STATUS[status as string]}
          variant={toLower(status as string) as any}
        />
      </View>
      <Text>Tổng SL tem: {totalBagsCount}</Text>
    </View>
  );
}

export default HeaderBag;
