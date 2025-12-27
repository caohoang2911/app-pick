import {
  ORDER_DELIVERY_TYPE,
  ORDER_STATUS,
  ORDER_TAGS,
} from '@/core/constants/order';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useCreateInvoiceProcess } from '~/src/api/app-pick/use-create-invoice';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { queryClient } from '~/src/api/shared/api-provider';
import { Button } from '~/src/components/Button';
import CODReceipt from '~/src/components/CODReceipt';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { useCheckShift } from '~/src/core/hooks/useCheckShift';
import {
  hideAlert,
  showAlert as showAlertDialog,
} from '~/src/core/store/alert-dialog';
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
import { formatCurrency } from '~/src/core/utils/number';
import { OrderDetailHeader } from '~/src/types/order-pick';

const ACTION_TYPE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế',
  DISABLE: 'Chưa thể giao hàng',
};

const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const base64StringReceiptRef = useRef<string>('');

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

  const { mutate: createInvoice, isPending: isLoadingCreateInvoice } =
    useCreateInvoiceProcess(code, () => {
      handoverOrder({ orderCode: code, proofImages: uploadedImages });
    });

  const uploadedImages = useOrderScanToDelivery.use.uploadedImages();

  const actionType = useMemo(
    () => ACTION_TYPE[handoverStatus as keyof typeof ACTION_TYPE],
    [handoverStatus],
  );

  const actionTypeWithInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Tạo hoá đơn & giao cho tài xế';
    }
    return 'Tạo hoá đơn & giao cho khách';
  }, [isInvoiceSupportedByAppPick]);

  const generateMessageCreateInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Bạn có chắc chắn tạo hóa đơn & giao cho tài xế?';
    }
    return 'Bạn có chắc chắn tạo hóa đơn & giao cho khách?';
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
      title: 'Tạo hoá đơn?',
      message: generateMessageCreateInvoice,
      onConfirm: () => {
        hideAlert();
        createInvoice({
          orderCode: code,
          codReceiptBase64String: base64StringReceiptRef.current || undefined,
        });
      },
    });
  });

  const handleCheckoutOrderBagsWithInvoice = () => {
    checkShift();
  };

  const handleStartDeliveryWithoutInvoice = () => {
    showAlertDialog({
      title: 'Xác nhận giao cho shipper?',
      message: 'Bạn có muốn xác nhận giao hàng cho shipper?',
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
    return !tags?.includes(ORDER_TAGS.ORDER_CREATED_INVOICE);
  }, [tags]);

  const renderAction = useMemo(() => {
    if (!orderBags.length && isPending) return null;
    return isAllDone ? (
      deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY ||
      !isInvoiceSupportedByAppPick ? (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
          onPress={handleStartDeliveryWithoutInvoice}
          label={actionType}
          disabled={handoverStatus === 'DISABLE'}
          variant="warning"
        />
      ) : (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
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

  const handleReceiptCaptureComplete = useCallback(
    async (base64String: string) => {
      try {
        // Tối ưu base64: loại bỏ whitespace và validate
        const optimizedBase64 = base64String.trim();

        base64StringReceiptRef.current = optimizedBase64;
      } catch (error) {
        showMessage({
          message: 'Có lỗi khi chụp phiếu thu',
          type: 'danger',
        });
      }
    },
    [code],
  );

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
                  • Đơn hàng chưa tạo hoá đơn. Vui lòng tạo hoá đơn trước khi
                  giao hàng
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
      <CODReceipt
        orderCode={code}
        invoiceNumber={orderDetail?.header?.invoiceCode || ''}
        codAmount={Number(codAmount)}
        employeeName={orderDetail?.header?.assignee?.name || ''}
        employeeCode={orderDetail?.header?.assignee?.username || ''}
        onCaptureComplete={handleReceiptCaptureComplete}
        enableCapture={Number(codAmount) > 0}
      />
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
