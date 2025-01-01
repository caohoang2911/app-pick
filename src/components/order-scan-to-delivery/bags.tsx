import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Box from '../Box';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import { transformOrderBags } from '~/src/core/utils/order-bag';
import { OrderBagLabel } from '~/src/types/order-bag';
import { OrderBagType } from '~/src/types/order-bag';
import BagType from './bag-type';
import { setOrderBags, useOrderScanToDelivery } from '~/src/core/store/order-scan-to-delivery';


function Bags() {
  const orderInvoice = useOrderInvoice.use.orderInvoice();  
  const { header } = orderInvoice || {};
  const { bagLabels } = header || {};


  const orderBags = useOrderScanToDelivery.use.orderBags();

  useEffect(() => {
    setOrderBags(bagLabels?.map((bag) => ({ ...bag, isDone: false })) || []);
  }, [bagLabels]);

  const orderBagTransform = useMemo(() => transformOrderBags(orderBags || []), [orderBags]);

  if(orderBags.length === 0) return null;

  return (
    <Box>
      <View className="flex flex-col gap-4">
        <BagType title={OrderBagLabel.DRY} type={OrderBagType.DRY} bagLabels={orderBagTransform.DRY} />
        <BagType title={OrderBagLabel.FROZEN} type={OrderBagType.FROZEN} bagLabels={orderBagTransform.FROZEN} />
        <BagType title={OrderBagLabel.FRESH} type={OrderBagType.FRESH} bagLabels={orderBagTransform.FRESH} />
        <BagType title={OrderBagLabel.NON_FOOD} type={OrderBagType.NON_FOOD} bagLabels={orderBagTransform.NON_FOOD} />
      </View>
    </Box> 
  )
}

export default Bags;
