import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useOrderStatusAutoRefresh } from '~/src/core/hooks/useOrderStatusAutoRefresh';
import InvoiceInfo from '~/src/components/order-invoice/invoice-info';
import InvoiceProducts from '~/src/components/order-invoice/invoice-products';
import ShippingInfo from '~/src/components/order-invoice/shipping-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import OrderInvoiceSkeleton from '~/src/components/shared/skeleton/order-detail-skeleton';

const OrderInvoice = () => {
  const navigation = useNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isOrderDetailLoading, orderDetailError } =
    useOrderDetailForCode(code);

  useOrderStatusAutoRefresh(code);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !isOrderDetailLoading,
    });
  }, [isOrderDetailLoading, navigation]);

  if (orderDetailError) {
    return (
      <SectionAlert variant="danger">
        <Text>{orderDetailError}</Text>
      </SectionAlert>
    );
  }

  if (isOrderDetailLoading) {
    return <OrderInvoiceSkeleton />;
  }

  return (
    <>
      <ScrollView className="flex-1 pt-3 mb-7">
        <View className="flex flex-col gap-4">
          <InvoiceInfo />
          <ShippingInfo />
          <InvoiceProducts />
        </View>
      </ScrollView>
    </>
  );
};

export default OrderInvoice;
