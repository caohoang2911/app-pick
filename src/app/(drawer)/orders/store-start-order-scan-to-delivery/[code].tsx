import { ORDER_DELIVERY_TYPE, ORDER_TAGS } from '@/core/constants/order';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import {
  useCreateInvoiceFlow,
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
import InvoiceAlert from '~/src/components/order-scan-to-delivery/invoice-alert';
import Bags from '~/src/components/store-start-order-scan-to-delivery/bags';
import InvoiceInfo from '~/src/components/store-start-order-scan-to-delivery/invoice-info';
import { useCheckShift } from '~/src/core/hooks/useCheckShift';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import {
  getIsScanQrCodeProduct,
  scanQrCodeSuccess,
  setStoreStartOrderBags,
  setStoreStartOrderDetail,
  toggleStoreStartScanQrCodeProduct,
  useStoreStartOrderScanToDelivery,
} from '~/src/core/store/store-start-order-scan-to-delivery';
import { OrderDetailHeader } from '~/src/types/order-pick';
import ShipperInfo from '~/src/components/shared/shipper-info';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { setUploadedImages } from '~/src/core/store/order-scan-to-delivery';
import { getScanToDeliveryInfo } from '~/src/core/utils/order';
import Header from '~/src/components/shared/Header';
import ButtonBack from '~/src/components/ButtonBack';
import Loading from '~/src/components/Loading';
import { useAuth } from '~/src/core';

const OrderScanToDelivery = () => {
  const navigation = useNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data, isPending, isFetching } = useOrderDetailQuery({
    orderCode: code,
  });

  const user = useAuth.use.userInfo();
  const { name, username } = user || {};

  const orderBags = useStoreStartOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct = getIsScanQrCodeProduct();

  // Tối ưu: lấy header trực tiếp từ selector thay vì toàn bộ orderDetail
  const header = useStoreStartOrderScanToDelivery(
    (state) => state.orderDetail?.header,
  ) as OrderDetailHeader | undefined;

  const {
    tags,
    deliveryType,
    isInvoiceSupportedByAppPick,
    codAmount,
    shipping,
    status,
  } = header || {};

  // Lấy orderDetail để dùng ở các chỗ khác
  const orderDetail = useStoreStartOrderScanToDelivery.use.orderDetail() || {};

  const title = getScanToDeliveryInfo({
    deliveryType,
    status,
    orderCode: code,
  })?.title;

  useEffect(() => {
    if (title) {
      navigation.setOptions({
        headerShown: true,
        header: () => (
          <Header
            title={title}
            headerLeft={<ButtonBack onPress={() => router.dismiss(1)} />}
          />
        ),
      });
    }
  }, [title, navigation]);

  const { mutate: processCreateInvoice, isPending: isLoadingCreateInvoice } =
    useCreateInvoiceProcess({
      onSuccess: () => {
        startSelfShipping({ orderCode: code });
        queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      },
    });
  const { mutate: createInvoiceFlow, data: createInvoiceFlowData } =
    useCreateInvoiceFlow({
      onSuccess: (orderCode) => {
        if (!Number(codAmount)) {
          processCreateInvoice({ orderCode });
        }
      },
    });
  // Ưu tiên invoiceCode từ API (đúng đơn hiện tại), tránh dính data đơn cũ khi chuyển đơn
  const invoiceCode =
    data?.data?.header?.invoiceCode ??
    createInvoiceFlowData?.data?.invoiceCode;

  const { isPending: isLoadingHandoverOrder, mutate: handoverOrder } =
    useHandoverOrder(() => {
      setLoading(false);
      setUploadedImages('', true);
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      router.back();
    });

  const shouldEnableCapture = Number(codAmount) > 0 && !!invoiceCode;

  // Reset store khi chuyển sang đơn khác, tránh hiển thị nhầm (đã in label, tạo HĐ, đơn hoàn tất của đơn trước)
  useEffect(() => {
    if (code) {
      setStoreStartOrderDetail({});
      setStoreStartOrderBags([]);
    }
  }, [code]);

  useEffect(() => {
    if (data?.data) {
      setStoreStartOrderDetail(data?.data || {});
    }
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
      title: btnWithInvoiceLabel + '?',
      onConfirm: () => {
        hideAlert();
        createInvoiceFlow({ orderCode: code });
      },
    });
  });

  const handleStartDeliveryWithInvoice = () => {
    checkShift();
  };

  const handleStartDeliveryWithoutInvoice = () => {
    showAlert({
      title: btnWithoutInvoiceLabel + '?',
      onConfirm: () => {
        hideAlert();
        if (isShipperDelivery) {
          handoverOrder({ orderCode: code });
        } else {
          startSelfShipping({ orderCode: code });
        }
      },
    });
  };

  const isShipperDelivery = !!shipping?.driverName;

  const btnWithoutInvoiceLabel = useMemo(() => {
    if (isShipperDelivery) {
      return 'Xác nhận giao cho tài xế';
    }
    return 'Bắt đầu giao hàng nội khu';
  }, [isShipperDelivery]);

  const btnWithInvoiceLabel = useMemo(() => {
    if (isShipperDelivery) {
      return 'Tạo hoá đơn & giao cho tài xế';
    }
    return 'Tạo hoá đơn & giao hàng nội khu';
  }, [isShipperDelivery]);

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

  if (isPending) {
    return <Loading />;
  }

  return (
    <>
      <View className="flex-1 mt-3">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
        >
          <InvoiceAlert show={isShowAlert} codAmount={codAmount} />
          <View className="flex flex-col gap-4">
            <ShipperInfo orderDetail={orderDetail} />
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
              label={btnWithoutInvoiceLabel}
            />
          ) : (
            <Button
              loading={
                isLoadingStartSelfShipping ||
                isLoadingCreateInvoice ||
                isLoadingHandoverOrder
              }
              onPress={handleStartDeliveryWithInvoice}
              disabled={isDisabled}
              label={btnWithInvoiceLabel}
            />
          )}
        </View>
      </View>
      <CODReceipt
        orderCode={code}
        invoiceNumber={invoiceCode || ''}
        codAmount={Number(codAmount)}
        employeeName={name || ''}
        employeeCode={username || ''}
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
