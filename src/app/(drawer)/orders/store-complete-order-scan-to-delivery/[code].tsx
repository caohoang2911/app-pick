import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import Box from '~/src/components/Box';
import { Button } from '~/src/components/Button';
import ImageUploader from '~/src/components/ImageUploader';
import { SectionAlert } from '~/src/components/SectionAlert';
import InvoiceInfo from '~/src/components/store-complete-scan-to-deivery/invoice-info';
import { ORDER_STATUS, ORDER_TAGS } from '~/src/contants/order';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setCompleteOrderDetail, setCompleteUploadedImages, useCompleteOrderScanToDelivery } from '~/src/core/store/complete-order-scan-to-delivery';
import { setLoading } from '~/src/core/store/loading';
import { getHeaderOrderDetailOrderPick } from '~/src/core/store/order-pick';
import { OrderDetailHeader } from '~/src/types/order-detail';

const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const { mutate: handoverOrder, isPending: isLoadingHandoverOrder } = useHandoverOrder(
    () => {
      setLoading(false);
      setCompleteUploadedImages('', true);
      router.push(`/orders/order-invoice/${code}`);
    }
  );

  const proofImages = useCompleteOrderScanToDelivery.use.uploadedImages();


  const header = getHeaderOrderDetailOrderPick();
  const { tags, status } = header as OrderDetailHeader;

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setCompleteOrderDetail(data?.data || {});
  }, [data]);

  useEffect(() => {
    return () => {
      setCompleteUploadedImages('', true);
    }
  }, []);

  if(data?.error) {
    return <SectionAlert variant='danger'><Text>{data?.error}</Text></SectionAlert>
  }

  const handleHandoverOrder = () => {
    showAlert({ 
      title: 'Hoàn tất giao hàng?',
      message: `Bạn có chắc chắn hoàn tất giao hàng?`,
      onConfirm: () => {
        hideAlert();
        handoverOrder({ orderCode: code, proofImages });
      },
    });
  }

  const handleUploadedImages = useCallback((image: string) => {
    setCompleteUploadedImages(image);
  }, []);

  const isShowAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_PRINTED_BILLL) 
  }, [tags]);


  const featureAvailable = status === ORDER_STATUS.SHIPPING;

  console.log('proofImages', proofImages);

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
            <Box>
              <ImageUploader proofDeliveryImages={proofImages} onUploadedImages={handleUploadedImages} />
            </Box>
          </View>
        </ScrollView>
      </View> 
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 bg-white ">
          <Button
            loading={isLoadingHandoverOrder}
            onPress={handleHandoverOrder}
            label={"Hoàn tất giao hàng"}
            disabled={featureAvailable && proofImages?.length === 0}
          />
        </View>
      </View>
    </>
  )
}

export default OrderScanToDelivery;