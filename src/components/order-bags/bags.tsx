import React from 'react';
import { View } from 'react-native';
import { useOrderBags } from '~/src/core/store/order-bags';
import { OrderBagLabel, OrderBagType } from '~/src/types/order-bags';
import BagType from './bag-type';

const Bags = () => {
  const orderBags = useOrderBags.use.orderBags();

  return (
    <View className="mb-2">
      <View className="flex flex-col gap-4">
        <BagType
          title={OrderBagLabel.DRY}
          type={OrderBagType.DRY}
          bagLabels={orderBags.DRY}
        />
        <BagType
          title={OrderBagLabel.FRESH}
          type={OrderBagType.FRESH}
          bagLabels={orderBags.FRESH}
        />
        <BagType
          title={OrderBagLabel.FROZEN}
          type={OrderBagType.FROZEN}
          bagLabels={orderBags.FROZEN}
        />
      </View>
    </View>
  );
};

export default Bags;
