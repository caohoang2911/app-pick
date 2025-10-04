import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { Button } from '~/src/components/Button';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { ORDER_STATUS, ORDER_TAGS } from '~/src/contants/order';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice } from '~/src/core/store/order-invoice';
import { getHeaderOrderDetailOrderPick } from '~/src/core/store/order-pick';
import { getIsScanQrCodeProduct, scanQrCodeSuccess, setUploadedImages, toggleScanQrCodeProduct, useOrderScanToDelivery } from '~/src/core/store/order-scan-to-delivery';
import { OrderDetailHeader } from '~/src/types/order-pick';

const ACTION_TYPE = {
  CUSTOMER_PICKUP: 'Xác nhận đã giao cho khách',
  OFFLINE_HOME_DELIVERY: 'Xác nhận đã giao cho khách',
  APARTMENT_COMPLEX_DELIVERY: 'Xác nhận đã giao cho khách',
  SHIPPER_DELIVERY: 'Xác nhận đã giao cho tài xế',
}
  
const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderBags = useOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct  = getIsScanQrCodeProduct();
  const header = getHeaderOrderDetailOrderPick();
  const { deliveryType, status, tags } = header as OrderDetailHeader;

  const uploadedImages = useOrderScanToDelivery.use.uploadedImages();
  
  const actionType = ACTION_TYPE[deliveryType as keyof typeof ACTION_TYPE];

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setOrderInvoice(data?.data || {});
  }, [data]);

  useEffect(() => {
    return () => {
      setUploadedImages('', true);
    }
  }, []);

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  const { isPending: isLoadingHandoverOrder, mutate: handoverOrder } = useHandoverOrder(() => {
    setLoading(false);
    setUploadedImages('', true);
    router.back();
  });

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabelScanned();

  const handleCheckoutOrderBags = () => {
    handoverOrder({ orderCode: code, proofImages: uploadedImages });
  }

  const  disableByStatus = useMemo(() => {
    if(deliveryType === 'STORE_DELIVERY' || deliveryType === 'CUSTOMER_PICKUP') {
      return status === ORDER_STATUS.SHIPPING;
    }

    return status !== ORDER_STATUS.STORE_PACKED;
  }, [deliveryType, status]);


  const isAllDone = useMemo(() => {

    return orderBags.every((bag) => bag.isDone || bag.lastScannedTime)
  }, [orderBags, disableByStatus]);

  const handleScanQrCodeProduct = (result: BarcodeScanningResult) => {
    scanQrCodeSuccess(result, () => {
      if(result?.data) {
        setOrderScanedBagLabel({ orderCode: code, bagCode: result?.data });
      }
    });
  }

  const showAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_PRINTED_BILLL) 
  }, [tags]);

  const renderAction = useMemo(() => {
    if(!orderBags.length && isPending) return null;
    return isAllDone ? (
      <Button
        loading={isLoadingHandoverOrder}
        onPress={handleCheckoutOrderBags}
        label={actionType}
        variant='warning'
      />
    ) : (
      <Button
        onPress={() => toggleScanQrCodeProduct(true)}
        icon={<FontAwesome name="qrcode" size={20} color="white" /> }
        label={'Scan túi'}
      />
    )
  }, [isAllDone, orderBags, isLoadingHandoverOrder, handleCheckoutOrderBags, actionType, isPending]);

  return (
    <>
      <View className='flex-1 mt-3'>
        <ScrollView>
          {showAlert && (
              <View className='px-4' style={{ marginBottom: 10 }}>
                <SectionAlert 
                    className='bg-yellow-500'
                    >
                    <Text className='text-white font-semibold'>
                      Hệ thống chưa ghi nhận In bill từ KDB. Vui lòng in bill trước khi giao hàng
                    </Text>
                </SectionAlert>
              </View>
            )
          }
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
            {renderAction}
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