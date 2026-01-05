import {
  ORDER_DELIVERY_TYPE,
  ORDER_STATUS,
  ORDER_TAGS,
} from '@/core/constants/order';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import Header from '~/src/components/shared/Header';
import {
  useCreateInvoice,
  useCreateInvoiceProcess,
} from '~/src/api/app-pick/use-create-invoice';
import { useOrderDetailQuery } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { queryClient } from '~/src/api/shared/api-provider';
import { Button } from '~/src/components/Button';
import CODReceipt from '~/src/components/CODReceipt';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import InvoiceAlert from '~/src/components/order-scan-to-delivery/invoice-alert';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import ShipperInfo from '~/src/components/shared/shipper-info';
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
import { getScanToDeliveryInfo } from '~/src/core/utils/order';
import { OrderDetailHeader } from '~/src/types/order-pick';
import Loading from '~/src/components/Loading';

const ACTION_TYPE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế',
  DISABLE: 'Chưa thể giao hàng',
};

const ACTION_CONFIRM_TITLE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách?',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế?',
};

const OrderScanToDelivery = () => {
  const navigation = useNavigation();
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

  const title = getScanToDeliveryInfo({
    deliveryType,
    status,
    orderCode: code,
  })?.title;

  useLayoutEffect(() => {
    if (title) {
      navigation.setOptions({
        headerShown: true,
        header: () => <Header title={title} />,
      });
    }
  }, [title, navigation]);

  const { mutateAsync: createInvoiceAsync, data: createInvoiceData } =
    useCreateInvoice();
  const invoiceCode = createInvoiceData?.data?.invoiceCode;

  const { mutate: processCreateInvoice, isPending: isLoadingCreateInvoice } =
    useCreateInvoiceProcess(code, () => {
      handoverOrder({ orderCode: code, proofImages: uploadedImages });
    });

  const shouldEnableCapture = Number(codAmount) > 0 && !!invoiceCode;

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
  }, [deliveryType, isInvoiceSupportedByAppPick]);

  const generateMessageCreateInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Bạn có chắc chắn tạo hóa đơn & giao cho tài xế?';
    }
    return 'Bạn có chắc chắn tạo hóa đơn & giao cho khách?';
  }, [deliveryType]);

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

  const handleCheckoutOrderBagsWithInvoice = () => {
    checkShift();
  };

  const handleStartDeliveryWithoutInvoice = () => {
    showAlertDialog({
      title:
        ACTION_CONFIRM_TITLE[
          handoverStatus as keyof typeof ACTION_CONFIRM_TITLE
        ],
      onConfirm: () => {
        hideAlert();
        handoverOrder({ orderCode: code, proofImages: uploadedImages });
      },
    });
  };

  const disableByStatus = useMemo(() => {
    if (deliveryType === 'CUSTOMER_PICKUP') {
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
    const isDisabled =
      !orderBags.length || isPending || handoverStatus === 'DISABLE';
    return isAllDone ? (
      deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY ||
      !isInvoiceSupportedByAppPick ? (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
          onPress={handleStartDeliveryWithoutInvoice}
          label={actionType}
          disabled={isDisabled}
          variant="warning"
        />
      ) : (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
          onPress={handleCheckoutOrderBagsWithInvoice}
          label={actionTypeWithInvoice}
          disabled={isDisabled}
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
    isLoadingCreateInvoice,
    handleStartDeliveryWithoutInvoice,
    handleCheckoutOrderBagsWithInvoice,
    actionType,
    actionTypeWithInvoice,
    deliveryType,
    isInvoiceSupportedByAppPick,
    isPending,
    handoverStatus,
    toggleScanQrCodeProduct,
  ]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  }, [queryClient]);

  const handleReceiptCaptureComplete = useCallback(
    (base64String: string) => {
      processCreateInvoice({
        orderCode: code,
        codReceiptBase64String: base64String.trim(),
      });
    },
    [code, processCreateInvoice],
  );

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
          <InvoiceAlert show={showAlert} codAmount={codAmount} />
          <View className="flex flex-col gap-4">
            <ShipperInfo />
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
        invoiceNumber={invoiceCode}
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
          onDestroy={() => toggleScanQrCodeProduct(false)}
        />
      )}
    </>
  );
};

export default OrderScanToDelivery;
