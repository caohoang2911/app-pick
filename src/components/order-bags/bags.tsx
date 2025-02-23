import React from 'react';
import { View } from 'react-native';
import { useOrderBag } from '~/src/core/store/order-bag';
import { OrderBagLabel, OrderBagType } from '~/src/types/order-bag';
import BagType from './bag-type';

const Bags = () => {
  const orderBags = useOrderBag.use.orderBags();

  return (
    <View className="mb-6">
      <View className="flex flex-col gap-4">
        <BagType title={OrderBagLabel.DRY} type={OrderBagType.DRY} bagLabels={orderBags.DRY} />
        <BagType title={OrderBagLabel.FRESH} type={OrderBagType.FRESH} bagLabels={orderBags.FRESH} />
        <BagType title={OrderBagLabel.FROZEN} type={OrderBagType.FROZEN} bagLabels={orderBags.FROZEN} />
        {/* <BagType title={OrderBagLabel.NON_FOOD} type={OrderBagType.NON_FOOD} bagLabels={orderBags.NON_FOOD} /> */}
      </View>
    </View>
  )
}

export default Bags;