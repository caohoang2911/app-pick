import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useUpdateOrderBagLabels } from '~/src/api/app-pick/use-update-order-bag-labels';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import Bags from '~/src/components/order-bags/bags';
import HeaderBag from '~/src/components/order-bags/header-bag';
import { SectionAlert } from '~/src/components/SectionAlert';
import { PackageSizePicker } from '~/src/components/shared/package-size-picker';
import { setLoading } from '~/src/core/store/loading';
import { setOrderDetail, useOrderBag } from '~/src/core/store/order-bag';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetailHeader } from '~/src/types/order-detail';
const OrderBags = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const orderDetail = useOrderPick.use.orderDetail();
  const { isRequireSelectShippingPackageSize } = orderDetail?.header as OrderDetailHeader;
  const hasUpdateOrderBagLabels = useOrderBag.use.hasUpdateOrderBagLabels();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });
  const orderBags = useOrderBag.use.orderBags();

  const deliveryType = orderDetail?.header?.deliveryType;

  const isShowPackageSizePicker = deliveryType !== 'CUSTOMER_PICKUP';
  
  const { mutate: updateOrderBagLabels } = useUpdateOrderBagLabels((error) => {
    if(error) {
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      showMessage({
        message: error,
        type: 'danger',
      });
    }
  });

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setOrderDetail(data?.data || {});
  }, [data]);

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  const handlePrintAll = () => {
    if(!isRequireSelectShippingPackageSize) {
      router.push(`/orders/print-preview?code=${code}`);
    } else {
      showMessage({
        message: 'Vui lòng chọn kích thước gói hàng',
        type: 'danger',
      });
    }
  }

  useEffect(() => {
    if(hasUpdateOrderBagLabels) {
      const mergedOrderBags = [...orderBags.DRY, ...orderBags.FRESH, ...orderBags.FROZEN];

      updateOrderBagLabels({
        data: mergedOrderBags,
        orderCode: code,
      });
    }
  }, [orderBags.DRY, orderBags.FRESH, orderBags.FROZEN]);

  return (
    <View className='flex-1 mb-4'>
      <ScrollView className='flex-1 pt-3 mb-4'>
        <View className='flex flex-col gap-4'>
          <HeaderBag />
          {isShowPackageSizePicker && <PackageSizePicker />}
          <Bags />
        </View>
      </ScrollView>
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 bg-white ">
          <Button label='In tất cả' onPress={handlePrintAll} />
        </View>
      </View>
    </View>
  )
}

export default OrderBags;
