import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { useStartSelfShipping } from '~/src/api/app-pick/use-start-self-shipping';
import { Button } from '~/src/components/Button';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import Bags from '~/src/components/store-start-order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/store-start-order-scan-to-delivery/invoice-info';
import { ORDER_TAGS } from '~/src/contants/order';
import { setLoading } from '~/src/core/store/loading';
import { getIsScanQrCodeProduct, scanQrCodeSuccess, setStoreStartOrderDetail, toggleStoreStartScanQrCodeProduct, useStoreStartOrderScanToDelivery } from '~/src/core/store/store-start-order-scan-to-delivery';
import { OrderDetailHeader } from '~/src/types/order-pick';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { queryClient } from '~/src/api/shared/api-provider';
const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderBags = useStoreStartOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct  = getIsScanQrCodeProduct();
  const orderDetail = useStoreStartOrderScanToDelivery.use.orderDetail() || {};

  const { tags, status } = orderDetail?.header as OrderDetailHeader || {};

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setStoreStartOrderDetail(data?.data || {});
  }, [data]);

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabelScanned();
  const { mutate: startSelfShipping, isPending: isLoadingStartSelfShipping } = useStartSelfShipping(() => {
    setLoading(false);
    router.replace(`/orders/store-complete-order-scan-to-delivery/${code}`);
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  });

  const isAllDone = useMemo(() => {

    return orderBags.every((bag) => bag.isDone || bag.lastScannedTime)
  }, [orderBags]);

  const handleScanQrCodeProduct = (result: BarcodeScanningResult) => {
    scanQrCodeSuccess(result, () => {
      if(result?.data) {
        setOrderScanedBagLabel({ orderCode: code, bagCode: result?.data });
      }
    });
  }

  const handleStartDelivery = () => {
    showAlert({
      title: 'Giao hàng?',
      message: 'Bạn có chắc chắn bắt đầu giao hàng?',
      onConfirm: () => {
        hideAlert();
        startSelfShipping({ orderCode: code });
      }
    });
  }

  const isShowAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_PRINTED_BILLL) 
  }, [tags]);

  return (
    <>
      <View className='flex-1 mt-3'>
        <ScrollView>
          {isShowAlert && (
              <View className='px-4' style={{ marginBottom: 10 }}>
                <SectionAlert 
                    style={{ backgroundColor: '#FFA500' }}
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
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 bg-white ">
          <Button
            loading={isLoadingStartSelfShipping}
            onPress={handleStartDelivery}
            disabled={!isAllDone}
            label={"Bắt đầu giao hàng"}
          />
        </View>
      </View>
      {isScanQrCodeProduct && (
        <ScannerBox
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleScanQrCodeProduct}
          onDestroy={() => toggleStoreStartScanQrCodeProduct(false)}
        />
      )}
    </>
  )
}

export default OrderScanToDelivery;