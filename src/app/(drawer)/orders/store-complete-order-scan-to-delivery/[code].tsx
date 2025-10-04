import { router, useLocalSearchParams, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useValidateDeliveryOrderFail } from '~/src/api/app-pick/use-validate-delivery-order-fail';
import Box from '~/src/components/Box';
import { Button } from '~/src/components/Button';
import ImageUploader from '~/src/components/ImageUploader';
import { Input } from '~/src/components/Input';
import SBottomSheet from '~/src/components/SBottomSheet';
import { SectionAlert } from '~/src/components/SectionAlert';
import InvoiceInfo from '~/src/components/store-complete-scan-to-deivery/invoice-info';
import { ORDER_STATUS, ORDER_TAGS } from '~/src/contants/order';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setCompleteOrderDetail, setCompleteUploadedImages, useCompleteOrderScanToDelivery } from '~/src/core/store/complete-order-scan-to-delivery';
import { setLoading } from '~/src/core/store/loading';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetailHeader } from '~/src/types/order-pick';

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

  const { mutate: validateDeliveryOrderFail, isPending: isLoadingValidateFail } = useValidateDeliveryOrderFail(
    () => {
      setLoading(false);

      const currentPath = segments.join('/');
    
      if (currentPath.includes('store-start-order-scan-to-delivery')) {
        router.dismiss(2);
      } else {
        router.back();
      }
    }
  );

  const proofImages = useCompleteOrderScanToDelivery.use.uploadedImages();
  const [failureReason, setFailureReason] = useState('');
  const [showFailureBottomSheet, setShowFailureBottomSheet] = useState(false);
  const failureBottomSheetRef = useRef<any>(null);
  const segments = useSegments();
  const orderDetail = useOrderPick.use.orderDetail();
  const { tags, status } = orderDetail?.header as OrderDetailHeader || {};

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

  const handleHandoverFailOrder = () => {
    failureBottomSheetRef.current?.present();
    setShowFailureBottomSheet(true);
  }

  const handleSubmitFailure = () => {
    if (!failureReason.trim()) {
      showAlert({
        title: 'Lỗi',
        message: 'Vui lòng nhập lý do giao hàng thất bại',
        onConfirm: () => {
          hideAlert();
        },
      });
      return;
    }

    setShowFailureBottomSheet(false);
    validateDeliveryOrderFail({ orderCode: code, reason: failureReason });
  }
  const handleUploadedImages = useCallback((image: string) => {
    setCompleteUploadedImages(image);
  }, []);

  const isShowAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_PRINTED_BILLL) 
  }, [tags]);


  const featureAvailable = status === ORDER_STATUS.SHIPPING;

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
        <View className="px-4 py-3 flex flex-row gap-3 bg-white ">
          <Button
            loading={isLoadingHandoverOrder}
            onPress={handleHandoverOrder}
            label={"Hoàn tất giao hàng"}
            className="flex-1"
            disabled={featureAvailable && proofImages?.length === 0}
          />
          <Button 
            className="flex-1"
            loading={isLoadingValidateFail}
            onPress={handleHandoverFailOrder}
            label={"Giao hàng thất bại"}
            variant="warning"
          />
        </View>
      </View>

      <SBottomSheet
        visible={showFailureBottomSheet}
        ref={failureBottomSheetRef}
        title="Lý do giao hàng thất bại"
        onClose={() => setShowFailureBottomSheet(false)}
        snapPoints={[300, 400]}
      >
        <View className="px-4 py-4">
          <Input
            placeholder="Nhập lý do giao hàng thất bại..."
            onChangeText={(value: string) => setFailureReason(value)}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100 }}
          />
          <View className="flex-row gap-3 mt-6">
            <Button
              label="Hủy"
              onPress={() => setShowFailureBottomSheet(false)}
              variant="secondary"
              className="flex-1"
            />
            <Button
              label="Xác nhận"
              onPress={handleSubmitFailure}
              loading={isLoadingValidateFail}
              className="flex-1"
            />
          </View>
        </View>
      </SBottomSheet>
    </>
  )
}

export default OrderScanToDelivery;