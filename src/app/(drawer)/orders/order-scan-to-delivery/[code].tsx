import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {  Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice } from '~/src/core/store/order-invoice';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import { getIsScanQrCodeProduct, scanQrCodeSuccess, toggleScanQrCodeProduct, useOrderScanToDelivery } from '~/src/core/store/order-scan-to-delivery';
import { Button } from '~/src/components/Button';
import { queryClient } from '~/src/api/shared';
import { getHeaderOrderDetailOrderPick } from '~/src/core/store/order-pick';
import { OrderDetailHeader } from '~/src/types/order-detail';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { BarcodeScanningResult } from 'expo-camera';
import { useSetOrderScanedBagLabel } from '~/src/api/app-pick/use-set-order-scaned-bag-label';
import { ORDER_STATUS } from '~/src/contants/order';

const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderBags = useOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct  = getIsScanQrCodeProduct();
  const header = getHeaderOrderDetailOrderPick();
  const { deliveryType, status } = header as OrderDetailHeader;

  const actionType = deliveryType ? (deliveryType === 'STORE_DELIVERY' || deliveryType === 'CUSTOMER_PICKUP' ? 'Hoàn tất đơn hàng' : 'Giao cho shipper') : '';

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setOrderInvoice(data?.data || {});
  }, [data]);

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  const { isPending: isLoadingCompleteOrder, mutate: completeOrder } = useCompleteOrder(() => {
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  });

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabel();

  const handleCheckoutOrderBags = () => {
    completeOrder({ orderCode: code });
  }

  const  disableByStatus = useMemo(() => {
    if(deliveryType === 'STORE_DELIVERY' || deliveryType === 'CUSTOMER_PICKUP') {
      return status === ORDER_STATUS.SHIPPING;
    }

    return status !== ORDER_STATUS.STORE_PACKED;
  }, [deliveryType, status]);


  const isAllDone = useMemo(() => {

    return orderBags.every((bag) => bag.isDone)
  }, [orderBags, disableByStatus]);

  const handleScanQrCodeProduct = (result: BarcodeScanningResult) => {
    scanQrCodeSuccess(result, (orderBagsCB) => {
      const isDone = orderBagsCB.every((bag) => bag.isDone)
      if(isDone) {
        setOrderScanedBagLabel({ orderCode: code });
      }
    });
  }

  return (
    <>
      <View className='flex-1 mt-3'>
        <ScrollView>
          <View className='flex flex-col gap-4'>
            <InvoiceInfo />
            <View className='border-t border-gray-200 pb-3'>
              <Bags />
            </View>
          </View>
        </ScrollView>
      </View> 
      {actionType && 
        <View className="border-t border-gray-200 pb-4">
          <View className="px-4 py-3 bg-white ">
            <Button
              loading={isLoadingCompleteOrder}
              onPress={handleCheckoutOrderBags}
              disabled={!isAllDone}
              label={actionType}
            />
          </View>
        </View>
      }
      {isScanQrCodeProduct && (
        <ScannerBox
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleScanQrCodeProduct}
          onDestroy={() => toggleScanQrCodeProduct(false)}
        />
      )}
    </>
  )
}

export default OrderScanToDelivery;