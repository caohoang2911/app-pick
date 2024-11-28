import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import HeaderBag from '~/src/components/order-bags/header-bag';
import Bags from '~/src/components/order-bags/bags';
import { SectionAlert } from '~/src/components/SectionAlert';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice } from '~/src/core/store/order-invoice';
import { setOrderDetail } from '~/src/core/store/order-bag';

const OrderBags = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
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

  return (
    <>
      <ScrollView className='flex-1 pt-3 mb-7'>
        <View className='flex flex-col gap-4'>
          <HeaderBag />
          <Bags />
        </View>
      </ScrollView>
    </>
  )
}

export default OrderBags;
