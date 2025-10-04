import { useLocalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React from 'react';
import { Text, View } from 'react-native';
import { ORDER_COUNTER_STATUS } from '~/src/contants/order';
import { useOrderBag } from '~/src/core/store/order-bag';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetailHeader } from '~/src/types/order-pick';
import { Badge } from '../Badge';

function HeaderBag() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const header = useOrderPick.use.orderDetail();
  const { status } = header?.header as OrderDetailHeader || {};
  

  const orderBags = useOrderBag.use.orderBags();
  const mergeOrderBags =  orderBags ? [...orderBags?.DRY || [], ...orderBags?.FRESH || [], ...orderBags?.FROZEN || []] : [];


  return (
    <View className="bg-white mx-4 px-4 py-3 flex flex-row justify-between rounded-md items-center gap-2">
      <View className="flex flex-row items-center gap-2">
        <Text className="text-base text-colorPrimary font-semibold">{code}</Text>
        <Badge
          label={ORDER_COUNTER_STATUS[status as string]}
          variant={toLower(status as string) as any}
        />
      </View>
      <Text>Tổng SL tem: {mergeOrderBags?.length ||  0}</Text>
    </View>
  )
}

export default HeaderBag;