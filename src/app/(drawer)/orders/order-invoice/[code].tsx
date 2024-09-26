import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import InvoiceInfo from '~/src/components/order-invoice/invoice-info';
import InvoiceProducts from '~/src/components/order-invoice/invoice-products';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice } from '~/src/core/store/order-invoice';

const OrderInvoice = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

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