import React, { useEffect } from 'react';
import { View } from 'react-native';
import { OrderBagItem, OrderBagLabel, OrderBagType } from '~/src/types/order-bag';
import BagType from './bag-type';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useLocalSearchParams } from 'expo-router';
import { setOrderBags, setOrderDetail, useOrderBag } from '~/src/core/store/order-bag';
const bagLabels: OrderBagItem[] = [
  {
    "code": "OLE20FEBE1-DR01",
    "type": "DRY" as OrderBagType
  },
  {
    "code": "OLE20FEBE1-DR02",
    "type": "DRY" as OrderBagType
  }
];

const Bags = () => {
  const orderBags = useOrderBag.use.orderBags();

  return (
    <View className="mb-6">
      <View className="flex flex-col gap-4">
        <BagType title={OrderBagLabel.DRY} type={OrderBagType.DRY} bagLabels={orderBags.DRY} />
        <BagType title={OrderBagLabel.FROZEN} type={OrderBagType.FROZEN} bagLabels={orderBags.FROZEN} />
        <BagType title={OrderBagLabel.FRESH} type={OrderBagType.FRESH} bagLabels={orderBags.FRESH} />
        <BagType title={OrderBagLabel.NON_FOOD} type={OrderBagType.NON_FOOD} bagLabels={orderBags.NON_FOOD} />
      </View>
    </View>
  )
}

export default Bags;