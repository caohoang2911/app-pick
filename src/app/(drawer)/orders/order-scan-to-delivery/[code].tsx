import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { Button } from '~/src/components/Button';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import {
  ORDER_DELIVERY_TYPE,
  ORDER_STATUS,
  ORDER_TAGS,
} from '@/core/constants/order';
import { setLoading } from '~/src/core/store/loading';
import { setOrderInvoice } from '~/src/core/store/order-invoice';
import { setOrderDetail, useOrderPick } from '~/src/core/store/order-pick';
import {
  getIsScanQrCodeProduct,
  scanQrCodeSuccess,
  setUploadedImages,
  toggleScanQrCodeProduct,
  useOrderScanToDelivery,
} from '~/src/core/store/order-scan-to-delivery';
import { OrderDetailHeader } from '~/src/types/order-pick';
import { useIssueInvoiceProcess } from '~/src/api/app-pick/use-issue-invoice';
import {
  hideAlert,
  showAlert as showAlertDialog,
} from '~/src/core/store/alert-dialog';
import { formatCurrency } from '~/src/core/utils/number';
import { queryClient } from '~/src/api/shared/api-provider';
import { useCheckShift } from '~/src/core/hooks/useCheckShift';

const ACTION_TYPE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế',
  DISABLE: 'Chưa thể giao hàng',
};

const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  useEffect(() => {
    if (data?.data) {
      setOrderDetail(data?.data || {});
    }
  }, [data]);

  const orderBags = useOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct = getIsScanQrCodeProduct();
  const orderDetail = useOrderPick.use.orderDetail();

  const {
    deliveryType,
    status,
    tags,
    handoverStatus,
    codAmount,
    isInvoiceSupportedByAppPick,
  } = (orderDetail?.header as OrderDetailHeader) || {};

  const { mutate: issueInvoice, isPending: isLoadingIssueInvoice } =
    useIssueInvoiceProcess(code, () => {
      handoverOrder({ orderCode: code, proofImages: uploadedImages });
    });

  const uploadedImages = useOrderScanToDelivery.use.uploadedImages();

  const actionType = useMemo(
    () => ACTION_TYPE[handoverStatus as keyof typeof ACTION_TYPE],
    [handoverStatus],
  );

  const actionTypeWithInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Xuất hóa đơn & giao cho tài xế';
    }
    return 'Xuất hóa đơn & giao cho khách';
  }, [isInvoiceSupportedByAppPick]);

  const generateMessageIssueInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Bạn có chắc chắn xuất hóa đơn & giao cho tài xế?';
    }
    return 'Bạn có chắc chắn xuất hóa đơn & giao cho khách?';
  }, [deliveryType]);

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setOrderInvoice(data?.data || {});
  }, [data]);

  useEffect(() => {
    return () => {
      setUploadedImages('', true);
    };
  }, []);

  if (data?.error) {
    return (
      <SectionAlert variant="danger">
        <Text>{data?.error}</Text>
      </SectionAlert>
    );
  }

  const { isPending: isLoadingHandoverOrder, mutate: handoverOrder } =
    useHandoverOrder(() => {
      setLoading(false);
      setUploadedImages('', true);
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      router.back();
    });

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabelScanned();

  const { checkShift } = useCheckShift(() => {
    showAlertDialog({
      title: 'Xuất hóa đơn?',
      message: generateMessageIssueInvoice,
      onConfirm: () => {
        hideAlert();
        issueInvoice({ orderCode: code });
      },
    });
  });

  const handleCheckoutOrderBagsWithInvoice = () => {
    checkShift();
  };

  const handleStartDeliveryWithoutInvoice = () => {
    showAlertDialog({
      title: 'Bắt đầu xác nhận giao hàng?',
      message: 'Bạn có muốn bắt đầu xác nhận giao hàng?',
      onConfirm: () => {
        hideAlert();
        handoverOrder({ orderCode: code, proofImages: uploadedImages });
      },
    });
  };

  const disableByStatus = useMemo(() => {
    if (
      deliveryType === 'STORE_DELIVERY' ||
      deliveryType === 'CUSTOMER_PICKUP'
    ) {
      return status === ORDER_STATUS.SHIPPING;
    }

    return status !== ORDER_STATUS.STORE_PACKED;
  }, [deliveryType, status]);

  const isAllDone = useMemo(() => {
    return orderBags.every((bag) => bag.isDone || bag.lastScannedTime);
  }, [orderBags, disableByStatus]);

  const handleScanQrCodeProduct = (result: BarcodeScanningResult) => {
    scanQrCodeSuccess(result, () => {
      if (result?.data) {
        setOrderScanedBagLabel({ orderCode: code, bagCode: result?.data });
      }
    });
  };

  const showAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_PRINTED_BILLL);
  }, [tags]);

  const renderAction = useMemo(() => {
    if (!orderBags.length && isPending) return null;
    return isAllDone ? (
      deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY ||
      !isInvoiceSupportedByAppPick ? (
        <Button
          loading={isLoadingHandoverOrder || isLoadingIssueInvoice}
          onPress={handleStartDeliveryWithoutInvoice}
          label={actionType}
          disabled={handoverStatus === 'DISABLE'}
          variant="warning"
        />
      ) : (
        <Button
          loading={isLoadingHandoverOrder || isLoadingIssueInvoice}
          onPress={handleCheckoutOrderBagsWithInvoice}
          label={actionTypeWithInvoice}
          variant="warning"
        />
      )
    ) : (
      <Button
        onPress={() => toggleScanQrCodeProduct(true)}
        icon={<FontAwesome name="qrcode" size={20} color="white" />}
        label={'Scan túi'}
      />
    );
  }, [
    isAllDone,
    orderBags,
    isLoadingHandoverOrder,
    handleStartDeliveryWithoutInvoice,
    actionType,
    isPending,
  ]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  }, []);

  return (
    <>
      <View className="flex-1 mt-3">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
        >
          {showAlert && (
            <View className="px-4" style={{ marginBottom: 10 }}>
              <SectionAlert className="bg-yellow-500">
                <Text className="text-white font-semibold">
                  • Đơn hàng chưa in hoá đơn. Vui lòng in hoá đơn trước khi giao
                  hàng
                </Text>
                {Boolean(codAmount) && (
                  <View className="mt-2">
                    <Text className="text-white font-semibold">
                      • Nhân viên siêu thị cần thu COD{' '}
                      {formatCurrency(codAmount, { unit: true })}
                    </Text>
                  </View>
                )}
              </SectionAlert>
            </View>
          )}
          <View className="flex flex-col gap-4">
            <InvoiceInfo />
            <View className="border-t border-gray-200 pb-3">
              <Bags />
            </View>
          </View>
        </ScrollView>
      </View>
      {actionType && (
        <View className="border-t border-gray-200 pb-4">
          <View className="px-4 py-3 bg-white ">{renderAction}</View>
        </View>
      )}
      {isScanQrCodeProduct && (
        <ScannerBox
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleScanQrCodeProduct}
          onDestroy={() => toggleScanQrCodeProduct(false)}
        />
      )}
    </>
  );
};

export default OrderScanToDelivery;
