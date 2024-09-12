import React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import InvoiceInfo from '~/src/components/order-invoice/invoice-info';
import InvoiceProducts from '~/src/components/order-invoice/invoice-products';

const OrderInvoice = () => {
  return (
    <View className='pt-3'>
      <ScrollView>
        <View className='flex flex-col gap-4'>
          <InvoiceInfo />
          <InvoiceProducts />
        </View>
      </ScrollView>
    </View>
  )
}

export default OrderInvoice;