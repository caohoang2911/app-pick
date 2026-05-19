import {
  router,
  useLocalSearchParams,
  useNavigation,
  useSegments,
} from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Text, View } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useValidateDeliveryOrderFail } from '~/src/api/app-pick/use-validate-delivery-order-fail';
import Box from '~/src/components/Box';
import { Button } from '~/src/components/Button';
import ImageUploader from '~/src/components/ImageUploader';
import { Input } from '~/src/components/Input';
import SBottomSheet from '~/src/components/SBottomSheet';
import { SectionAlert } from '~/src/components/SectionAlert';
import InvoiceInfo from '~/src/components/store-complete-scan-to-deivery/invoice-info';
import { ORDER_STATUS, ORDER_TAGS } from '@/core/constants/order';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import {
  setCompleteUploadedImages,
  useCompleteOrderScanToDelivery,
} from '~/src/core/store/complete-order-scan-to-delivery';
import { setLoading } from '~/src/core/store/loading';
import { OrderDetailHeader } from '~/src/types/order-pick';
import InvoiceAlert from '~/src/components/order-scan-to-delivery/invoice-alert';
import ShipperInfo from '~/src/components/shared/shipper-info';
import Header from '~/src/components/shared/Header';
import ButtonBack from '~/src/components/ButtonBack';
import { getScanToDeliveryInfo } from '~/src/core/utils/order';
import { queryClient } from '~/src/api/shared/api-provider';
import ScanBagsSkeleton from '~/src/components/shared/skeleton/scan-bags-skeleton';

const OrderScanToDelivery = () => {
  const navigation = useNavigation();
  const segments = useSegments();
  const { code } = useLocalSearchParams<{ code: string }>();
  const {
    isOrderDetailLoading,
    isOrderDetailFetching,
    orderDetailError,
    orderDetail,
  } = useOrderDetailForCode(code);

  const header = orderDetail?.header;
  const { tags, status, codAmount, deliveryType, shipping } =
    (header as OrderDetailHeader) || {};

  const proofImages = useCompleteOrderScanToDelivery.use.uploadedImages();
  const [failureReason, setFailureReason] = useState('');
  const [showFailureBottomSheet, setShowFailureBottomSheet] = useState(false);
  const failureBottomSheetRef = useRef<any>(null);

  const failureBottomSheetHeight = useMemo(() => {
    const maxHeight = Math.floor(Dimensions.get('window').height * 0.55);
    return Math.min(420, maxHeight);
  }, []);

  const title = getScanToDeliveryInfo({
    deliveryType,
    status,
    orderCode: code,
    shipping,
  })?.title;

  const closeFailureBottomSheet = useCallback(() => {
    setShowFailureBottomSheet(false);
  }, []);

  const { mutate: handoverOrder, isPending: isLoadingHandoverOrder } =
    useHandoverOrder(() => {
      setLoading(false);
      setCompleteUploadedImages('', true);
      router.push(`/orders`);
    });

  const {
    mutate: validateDeliveryOrderFail,
    isPending: isLoadingValidateFail,
  } = useValidateDeliveryOrderFail(() => {
    setLoading(false);

    const currentPath = segments.join('/');

    if (currentPath.includes('store-start-order-scan-to-delivery')) {
      router.dismiss(2);
    } else {
      router.back();
    }
  });

  useLayoutEffect(() => {
    if (code) setCompleteUploadedImages('', true);
  }, [code]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <Header
          title={title || ''}
          headerLeft={<ButtonBack onPress={() => router.dismiss(1)} />}
        />
      ),
    });
  }, [title, navigation, code, deliveryType, status]);

  useEffect(() => {
    return () => {
      setCompleteUploadedImages('', true);
    };
  }, []);

  useEffect(() => {
    if (showFailureBottomSheet) {
      failureBottomSheetRef.current?.present();
    }
  }, [showFailureBottomSheet]);

  const handleUploadedImages = useCallback((image: string) => {
    setCompleteUploadedImages(image);
  }, []);

  const isShowAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_CREATED_INVOICE);
  }, [tags]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'], exact: true });
  }, []);

  const featureAvailable = status === ORDER_STATUS.SHIPPING;

  const handleHandoverOrder = useCallback(() => {
    showAlert({
      title: 'Hoàn tất giao hàng?',
      message: `Bạn có chắc chắn hoàn tất giao hàng?`,
      onConfirm: () => {
        hideAlert();
        handoverOrder({ orderCode: code, proofImages });
      },
    });
  }, [code, handoverOrder, proofImages]);

  const handleHandoverFailOrder = useCallback(() => {
    setFailureReason('');
    setShowFailureBottomSheet(true);
  }, []);

  const handleSubmitFailure = useCallback(() => {
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

    failureBottomSheetRef.current?.dismiss();
    validateDeliveryOrderFail({ orderCode: code, reason: failureReason });
  }, [code, failureReason, validateDeliveryOrderFail]);

  if (orderDetailError) {
    return (
      <SectionAlert variant="danger">
        <Text>{orderDetailError}</Text>
      </SectionAlert>
    );
  }

  if (isOrderDetailLoading) {
    return <ScanBagsSkeleton />;
  }

  return (
    <>
      <View className="flex-1 mt-3">
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isOrderDetailFetching}
              onRefresh={handleRefresh}
            />
          }
        >
          <InvoiceAlert show={isShowAlert} codAmount={codAmount} />
          <View className="flex flex-col gap-4">
            <ShipperInfo orderDetail={orderDetail || {}} />
            <InvoiceInfo />
            <Box>
              <ImageUploader
                proofDeliveryImages={proofImages}
                onUploadedImages={handleUploadedImages}
              />
            </Box>
          </View>
        </ScrollView>
      </View>
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 flex flex-row gap-3 bg-white ">
          <Button
            loading={isLoadingHandoverOrder}
            onPress={handleHandoverOrder}
            label={'Hoàn tất giao hàng'}
            className="flex-1"
            disabled={featureAvailable && proofImages?.length === 0}
          />
          <Button
            className="flex-1"
            loading={isLoadingValidateFail}
            onPress={handleHandoverFailOrder}
            label={'Giao hàng thất bại'}
            variant="warning"
          />
        </View>
      </View>

      <SBottomSheet
        visible={showFailureBottomSheet}
        ref={failureBottomSheetRef}
        title="Lý do giao hàng thất bại"
        onClose={closeFailureBottomSheet}
        snapPoints={[failureBottomSheetHeight]}
      >
        <View
          key={showFailureBottomSheet ? 'open' : 'closed'}
          className="px-4 py-4"
        >
          <Input
            placeholder="Nhập lý do giao hàng thất bại..."
            value={failureReason}
            onChangeText={setFailureReason}
            multiline
            numberOfLines={4}
            useBottomSheetTextInput
            textAlignVertical="top"
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
          <View className="flex-row gap-3 mt-6">
            <Button
              label="Hủy"
              onPress={() => failureBottomSheetRef.current?.dismiss()}
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
  );
};

export default OrderScanToDelivery;
