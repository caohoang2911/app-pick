import { useQuery } from '@tanstack/react-query';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import ActionsBottom from '~/src/components/order-invoice/actions-bottom';
import InvoiceInfo from '~/src/components/order-invoice/invoice-info';
import InvoiceProducts from '~/src/components/order-invoice/invoice-products';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice, useOrderInvoice } from '~/src/core/store/order-invoice';
import { OrderStatusValue } from '~/src/types/order';

const OrderInvoice = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { status, tags} = header || {}

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setOrderInvoice(data?.data || {});
  }, [data]);

  return (
    <>
      <ScrollView className='flex-1 pt-3 mb-7'>
        <View className='flex flex-col gap-4'>
          <InvoiceInfo />
          <InvoiceProducts />
        </View>
      </ScrollView>
    </>
  )
}

export default OrderInvoice;