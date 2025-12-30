import { ORDER_DELIVERY_TYPE, ORDER_TAGS } from '@/core/constants/order';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import {
  useCreateInvoice,
  useCreateInvoiceProcess,
} from '~/src/api/app-pick/use-create-invoice';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { useStartSelfShipping } from '~/src/api/app-pick/use-start-self-shipping';
import { queryClient } from '~/src/api/shared/api-provider';
import { Button } from '~/src/components/Button';
import CODReceipt from '~/src/components/CODReceipt';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import Bags from '~/src/components/store-start-order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/store-start-order-scan-to-delivery/invoice-info';
import { useCheckShift } from '~/src/core/hooks/useCheckShift';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import {
  getIsScanQrCodeProduct,
  scanQrCodeSuccess,
  setStoreStartOrderDetail,
  toggleStoreStartScanQrCodeProduct,
  useStoreStartOrderScanToDelivery,
} from '~/src/core/store/store-start-order-scan-to-delivery';
import { OrderDetailHeader } from '~/src/types/order-pick';

const OrderScanToDelivery = () => {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const orderBags = useStoreStartOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct = getIsScanQrCodeProduct();
  const orderDetail = useStoreStartOrderScanToDelivery.use.orderDetail() || {};

  const { tags, deliveryType, isInvoiceSupportedByAppPick, codAmount } =
    (orderDetail?.header as OrderDetailHeader) || {};

  const { mutateAsync: createInvoiceAsync, data: createInvoiceData } =
    useCreateInvoice();
  const invoiceCode = createInvoiceData?.data?.invoiceCode;

  const { mutate: processCreateInvoice, isPending: isLoadingCreateInvoice } =
    useCreateInvoiceProcess(code, () => {
      startSelfShipping({ orderCode: code });
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    });

  const shouldEnableCapture = Number(codAmount) > 0 && !!invoiceCode;

  useEffect(() => {
    setLoading(isPending || isFetching);
  }, [isPending, isFetching]);

  useEffect(() => {
    setStoreStartOrderDetail(data?.data || {});
  }, [data]);

  if (data?.error) {
    return (
      <SectionAlert variant="danger">
        <Text>{data?.error}</Text>
      </SectionAlert>
    );
  }

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabelScanned();
  const { mutate: startSelfShipping, isPending: isLoadingStartSelfShipping } =
    useStartSelfShipping(() => {
      showMessage({
        message: 'Tạo hoá đơn & bắt đầu giao hàng thành công',
        type: 'success',
      });
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      router.replace(`/orders/store-complete-order-scan-to-delivery/${code}`);
    });

  const isAllDone = useMemo(() => {
    return orderBags.every((bag) => bag.isDone || bag.lastScannedTime);
  }, [orderBags]);

  const handleScanQrCodeProduct = (result: BarcodeScanningResult) => {
    scanQrCodeSuccess(result, () => {
      if (result?.data) {
        setOrderScanedBagLabel({ orderCode: code, bagCode: result?.data });
      }
    });
  };

  const { checkShift } = useCheckShift(() => {
    showAlert({
      title: 'Tạo hoá đơn & giao hàng?',
      message: 'Bạn có muốn xuất hóa đơn & bắt đầu giao hàng?',
      onConfirm: async () => {
        hideAlert();
        const createInvoiceResult = await createInvoiceAsync({
          orderCode: code,
        });

        if (createInvoiceResult?.error) {
          showMessage({
            message: createInvoiceResult?.error,
            type: 'danger',
          });
          return;
        }

        if (!Number(codAmount)) {
          processCreateInvoice({
            orderCode: code,
          });
        }
      },
    });
  });

  const handleStartDeliveryWithInvoice = () => {
    checkShift();
  };

  const handleStartDeliveryWithoutInvoice = () => {
    showAlert({
      title: 'Bắt đầu xác nhận giao hàng?',
      message: 'Bạn có muốn bắt đầu xác nhận giao hàng?',
      onConfirm: () => {
        hideAlert();
        startSelfShipping({ orderCode: code });
      },
    });
  };

  const handleStartScanQrCodeProduct = () => {
    toggleStoreStartScanQrCodeProduct(true);
  };

  const isShowAlert = useMemo(() => {
    return !tags?.includes(ORDER_TAGS.ORDER_CREATED_INVOICE);
  }, [tags]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  }, []);

  const handleReceiptCaptureComplete = useCallback(
    (base64String: string) => {
      processCreateInvoice({
        orderCode: code,
        codReceiptBase64String: base64String.trim(),
      });
    },
    [code, processCreateInvoice],
  );

  const isDisabled = !orderBags.length || isPending;

  return (
    <>
      <View className="flex-1 mt-3">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
        >
          {isShowAlert && (
            <View className="px-4" style={{ marginBottom: 10 }}>
              <SectionAlert style={{ backgroundColor: '#FFA500' }}>
                <Text className="text-white font-semibold">
                  Hệ thống chưa ghi nhận In bill từ KDB. Vui lòng in bill trước
                  khi giao hàng
                </Text>
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
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 bg-white gap-2">
          {!isAllDone ? (
            <Button
              loading={isLoadingStartSelfShipping}
              onPress={handleStartScanQrCodeProduct}
              disabled={isDisabled}
              label={'Scan QR túi để giao hàng'}
            />
          ) : deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY ||
            !isInvoiceSupportedByAppPick ? (
            <Button
              loading={isLoadingStartSelfShipping}
              onPress={handleStartDeliveryWithoutInvoice}
              disabled={isDisabled}
              label={'Bắt đầu giao hàng'}
            />
          ) : (
            <Button
              loading={isLoadingStartSelfShipping || isLoadingCreateInvoice}
              onPress={handleStartDeliveryWithInvoice}
              disabled={isDisabled}
              label="Tạo hoá đơn & bắt đầu giao hàng"
            />
          )}
        </View>
      </View>
      <CODReceipt
        orderCode={code}
        invoiceNumber={invoiceCode || ''}
        codAmount={Number(codAmount)}
        employeeName={orderDetail?.header?.picker?.name || ''}
        employeeCode={orderDetail?.header?.picker?.username || ''}
        onCaptureComplete={handleReceiptCaptureComplete}
        enableCapture={shouldEnableCapture}
      />
      {isScanQrCodeProduct && (
        <ScannerBox
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleScanQrCodeProduct}
          onDestroy={() => toggleStoreStartScanQrCodeProduct(false)}
        />
      )}
    </>
  );
};

export default OrderScanToDelivery;
