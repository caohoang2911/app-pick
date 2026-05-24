import { useLocalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React from 'react';
import { Text, View } from 'react-native';
import { ORDER_COUNTER_STATUS } from '@/core/constants/order';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useOrderBag } from '~/src/core/store/order-bag';
import { Badge } from '../Badge';
import LabelTags from '../shared/LabelTags';

function HeaderBag() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { orderDetail } = useOrderDetailForCode(code);
  const status = orderDetail?.header?.status;
  const tags = orderDetail?.header?.tags;

  const totalBagsCount = useOrderBag((s) => {
    const b = s.orderBags;
    return (
      (b?.DRY?.length || 0) + (b?.FRESH?.length || 0) + (b?.FROZEN?.length || 0)
    );
  });

  return (
    <View className="bg-white mx-4 px-4 py-3 rounded-md gap-2">
      <View className="flex flex-row justify-between items-center gap-2">
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
      <LabelTags tags={tags} />
    </View>
  );
}

export default HeaderBag;
