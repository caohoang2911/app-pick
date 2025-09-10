import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import InvoiceInfo from '~/src/components/order-invoice/invoice-info';
import InvoiceProducts from '~/src/components/order-invoice/invoice-products';
import ShippingInfo from '~/src/components/order-invoice/shipping-info';
import { SectionAlert } from '~/src/components/SectionAlert';
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

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  if(!data ) {
    return null;
  }

  return (
    <>
      <ScrollView className='flex-1 pt-3 mb-7'>
        <View className='flex flex-col gap-4'>
          <InvoiceInfo />
          <ShippingInfo />
          <InvoiceProducts />
        </View>
      </ScrollView>
    </>
  )
}

export default OrderInvoice;