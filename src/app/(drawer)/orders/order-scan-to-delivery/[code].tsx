/**
 * Scan túi & giao — gom shipping: Zustand tiến độ theo nhóm, popup chỉ khi bấm «Tạo hoá đơn & giao…».
 * Chỉ màn này; store `order-scan-group-shipping-progress` không dùng nơi khác.
 */
import {
  ORDER_DELIVERY_TYPE,
  ORDER_STATUS,
  ORDER_TAGS,
} from '@/core/constants/order';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  useCreateInvoiceFlow,
  useCreateInvoiceProcess,
  usePrintCodReceiptProcess,
} from '~/src/api/app-pick/use-create-invoice';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { useSetOrderScanedBagLabelScanned } from '~/src/api/app-pick/use-set-order-scaned-bag-label-scanned';
import { queryClient } from '~/src/api/shared/api-provider';
import { Button } from '~/src/components/Button';
import CODReceipt from '~/src/components/CODReceipt';
import Bags from '~/src/components/order-scan-to-delivery/bags';
import InvoiceAlert from '~/src/components/order-scan-to-delivery/invoice-alert';
import InvoiceInfo from '~/src/components/order-scan-to-delivery/invoice-info';
import { SectionAlert } from '~/src/components/SectionAlert';
import Header from '~/src/components/shared/Header';
import ScannerBox from '~/src/components/shared/ScannerBox';
import ShipperInfo from '~/src/components/shared/shipper-info';
import { useAuth } from '~/src/core';
import { useCheckShift } from '~/src/core/hooks/useCheckShift';
import {
  hideAlert,
  showAlert as showAlertDialog,
} from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import {
  ensureOrderScanGroupShipping,
  getFirstIncompleteOrderCode,
  getGroupShippingProgressKey,
  isGroupShippingBagsComplete,
  markOrderScanGroupOrderBagsComplete,
  resetOrderScanGroupShippingProgress,
  useOrderScanGroupShippingProgress,
} from '~/src/core/store/order-scan-group-shipping-progress';
import {
  getIsScanQrCodeProduct,
  resetOrderBags,
  scanQrCodeSuccess,
  setUploadedImages,
  toggleScanQrCodeProduct,
  useOrderScanToDelivery,
} from '~/src/core/store/order-scan-to-delivery';
import { getScanToDeliveryInfo } from '~/src/core/utils/order';
import { transformBagsData } from '~/src/core/utils/order-bag';
import { OrderDetailHeader } from '~/src/types/order-pick';
import { BarcodeScanningResult } from '~/src/types/scanner';
import ScanBagsSkeleton from '~/src/components/shared/skeleton/scan-bags-skeleton';

const ACTION_TYPE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế',
  DISABLE: 'Chưa thể giao hàng',
};

const ACTION_CONFIRM_TITLE = {
  HANDOVER_TO_CUSTOMER: 'Xác nhận giao cho khách?',
  HANDOVER_TO_SHIPPER: 'Xác nhận giao cho tài xế?',
};

const ORDER_SCAN_TO_DELIVERY_PATH = '/orders/order-scan-to-delivery';

const OrderScanToDelivery = () => {
  const navigation = useNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);

  const user = useAuth.use.userInfo();
  const { name, username } = user || {};

  const {
    isOrderDetailLoading,
    isOrderDetailFetching,
    orderDetailError,
    orderDetail,
  } = useOrderDetailForCode(code);

  useLayoutEffect(() => {
    if (code) {
      resetOrderBags();
      setUploadedImages('', true);
    }
  }, [code]);

  const orderBags = useOrderScanToDelivery.use.orderBags();

  const isScanQrCodeProduct = getIsScanQrCodeProduct();

  const header = orderDetail?.header as OrderDetailHeader | undefined;

  const { deliveryType, status, tags, handoverStatus, codAmount } =
    header || {};

  const groupShippingOrderCodes = header?.groupShippingOrderCodes;
  const groupKey = useMemo(() => getGroupShippingProgressKey(header), [header]);
  const isMultiGroup = Boolean(
    groupShippingOrderCodes && groupShippingOrderCodes.length > 1 && groupKey,
  );
  const groupCodes = isMultiGroup ? groupShippingOrderCodes! : null;

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

  const invalidateOrderDetail = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  }, [code]);

  const uploadedImages = useOrderScanToDelivery.use.uploadedImages();

  useEffect(() => {
    return () => {
      resetOrderBags();
      toggleScanQrCodeProduct(false);
      setUploadedImages('', true);
    };
  }, []);

  const { isPending: isLoadingHandoverOrder, mutate: handoverOrder } =
    useHandoverOrder(() => {
      setLoading(false);

      setUploadedImages('', true);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });

      if (isMultiGroup) {
        if (assertGroupShippingReadyForSubmit()) {
          resetOrderScanGroupShippingProgress();
          router.back();
        }
      } else {
        resetOrderScanGroupShippingProgress();
        router.back();
      }
    });

  const {
    mutateAsync: processCreateInvoice,
    isPending: isLoadingCreateInvoice,
  } = useCreateInvoiceProcess({
    onSuccess: () => {
      handoverOrder({ orderCode: code, proofImages: uploadedImages });
      queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
    },
  });

  const { mutateAsync: printCodReceipt } = usePrintCodReceiptProcess({
    successMessage: 'In phiếu thu COD thành công',
  });

  const createInvoiceFlowOrderCodeRef = useRef<string | null>(null);
  const { mutate: createInvoiceFlow, data: createInvoiceFlowData } =
    useCreateInvoiceFlow({
      onSuccess: async (orderCode) => {
        await invalidateOrderDetail();
        await processCreateInvoice({ orderCode });
        if (!!Number(codAmount)) {
          setShowPrintReceipt(true);
          setLoading(false);
        }
      },
    });

  const invoiceCode =
    orderDetail?.header?.invoiceCode ??
    (createInvoiceFlowOrderCodeRef.current === code
      ? createInvoiceFlowData?.data?.invoiceCode
      : undefined);

  const shouldEnableCapture = Number(codAmount) > 0 && showPrintReceipt;

  const actionType = useMemo(
    () => ACTION_TYPE[handoverStatus as keyof typeof ACTION_TYPE],
    [handoverStatus],
  );

  const actionTypeWithInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Tạo hoá đơn & giao cho tài xế';
    }
    return 'Tạo hoá đơn & giao cho khách';
  }, [deliveryType]);

  const generateMessageCreateInvoice = useMemo(() => {
    if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
      return 'Bạn có chắc chắn tạo hóa đơn & giao cho tài xế?';
    }
    return 'Bạn có chắc chắn tạo hóa đơn & giao cho khách?';
  }, [deliveryType]);

  const { mutate: setOrderScanedBagLabel } = useSetOrderScanedBagLabelScanned();

  const { checkShift } = useCheckShift(() => {
    showAlertDialog({
      title: 'Tạo hoá đơn?',
      message: generateMessageCreateInvoice,
      onConfirm: () => {
        hideAlert();
        createInvoiceFlowOrderCodeRef.current = code;
        setLoading(true);
        createInvoiceFlow({ orderCode: code });
      },
    });
  });

  const disableByStatus = useMemo(() => {
    if (deliveryType === 'CUSTOMER_PICKUP') {
      return status === ORDER_STATUS.SHIPPING;
    }

    return status !== ORDER_STATUS.STORE_PACKED;
  }, [deliveryType, status]);

  const serverAllBagsDone = useMemo(() => {
    const labels = orderDetail?.header?.bagLabels;
    if (!labels?.length) return false;
    const bagsType = transformBagsData(labels);
    const flat = [...bagsType.DRY, ...bagsType.FROZEN, ...bagsType.FRESH];
    return (
      flat.length > 0 && flat.every((bag) => bag.isDone || bag.lastScannedTime)
    );
  }, [orderDetail?.header?.bagLabels]);

  const isAllDone = useMemo(() => {
    if (!Array.isArray(orderBags) || orderBags.length === 0) {
      return serverAllBagsDone;
    }
    const localDone = orderBags.every(
      (bag) => bag.isDone || bag.lastScannedTime,
    );
    return localDone || serverAllBagsDone;
  }, [orderBags, serverAllBagsDone, disableByStatus]);

  const promptNavigateToOrder = useCallback((targetCode: string) => {
    router.replace(`${ORDER_SCAN_TO_DELIVERY_PATH}/${targetCode}`);
  }, []);

  /** Gom shipping: chỉ popup này, chỉ khi bấm «Tạo hoá đơn & giao…» (không check nơi khác). */
  const assertGroupShippingReadyForSubmit = useCallback((): boolean => {
    if (
      !isMultiGroup ||
      !groupCodes?.length ||
      !groupKey ||
      !code ||
      orderDetailError
    ) {
      return true;
    }
    if (!isAllDone) {
      return true;
    }

    markOrderScanGroupOrderBagsComplete(code);
    const scanned = useOrderScanGroupShippingProgress.getState().scannedByCode;
    if (isGroupShippingBagsComplete(groupCodes, scanned)) {
      return true;
    }

    const nextCode = getFirstIncompleteOrderCode(groupCodes, scanned);
    if (!nextCode) {
      return true;
    }

    showAlertDialog({
      stackId: 'order-scan-group-shipping-submit',
      message: (
        <Text className="text-base text-gray-900">
          Đơn hàng gom shipping, NV siêu thị cần scan & giao cho tài xế đơn tiếp
          theo <Text className="font-bold">{nextCode}</Text>
        </Text>
      ),
      blockDismiss: true,
      isHideCancelButton: true,
      confirmText: 'Xác nhận',
      onConfirm: () => {
        hideAlert();
        promptNavigateToOrder(nextCode);
      },
    });
    return false;
  }, [
    isMultiGroup,
    groupCodes,
    groupKey,
    code,
    orderDetailError,
    isAllDone,
    promptNavigateToOrder,
  ]);

  useEffect(() => {
    if (
      !groupKey ||
      !groupCodes ||
      orderDetailError ||
      isOrderDetailLoading ||
      !code
    ) {
      return;
    }
    ensureOrderScanGroupShipping(groupKey, groupCodes);
  }, [groupKey, groupCodes, orderDetailError, isOrderDetailLoading, code]);

  const handleCheckoutOrderBagsWithInvoice = useCallback(() => {
    checkShift();
  }, [checkShift, assertGroupShippingReadyForSubmit]);

  const handleStartDeliveryWithoutInvoice = useCallback(() => {
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
  }, [handoverStatus, code, uploadedImages, handoverOrder]);

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

  const disableActionWithoutInvoice = useMemo(() => {
    const hasDriverInfo =
      !!header?.shipping?.driverPhone && !!header?.shipping?.driverName;
    const baseDisable =
      !orderBags.length || isOrderDetailLoading || handoverStatus === 'DISABLE';

    return (
      baseDisable ||
      (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY && !hasDriverInfo)
    );
  }, [
    orderBags,
    isOrderDetailLoading,
    handoverStatus,
    header?.shipping?.driverPhone,
    header?.shipping?.driverName,
    deliveryType,
  ]);

  const renderAction = useMemo(() => {
    const isDisabledWithoutInvoice =
      !orderBags.length || isOrderDetailLoading || handoverStatus === 'DISABLE';
    return isAllDone ? (
      deliveryType === ORDER_DELIVERY_TYPE.OFFLINE_HOME_DELIVERY ? (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
          onPress={handleStartDeliveryWithoutInvoice}
          label={actionType}
          disabled={isDisabledWithoutInvoice}
          variant="warning"
        />
      ) : (
        <Button
          loading={isLoadingHandoverOrder || isLoadingCreateInvoice}
          onPress={handleCheckoutOrderBagsWithInvoice}
          label={actionTypeWithInvoice}
          disabled={disableActionWithoutInvoice}
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
    isOrderDetailLoading,
    handoverStatus,
    toggleScanQrCodeProduct,
  ]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  }, [code]);

  const handleReceiptCaptureComplete = useCallback(
    async (base64String: string) => {
      await printCodReceipt({ codReceiptBase64String: base64String.trim() });
    },
    [printCodReceipt],
  );

  if (isOrderDetailLoading) {
    return <ScanBagsSkeleton />;
  }

  if (orderDetailError) {
    return (
      <SectionAlert variant="danger">
        <Text>{orderDetailError}</Text>
      </SectionAlert>
    );
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
          <InvoiceAlert
            show={showAlert}
            orderDetail={orderDetail}
            codAmount={codAmount}
          />
          <View className="flex flex-col gap-4">
            <ShipperInfo orderDetail={orderDetail || {}} />
            <InvoiceInfo />
            <View className="border-t border-gray-200 pb-3">
              <Bags bagLabels={header?.bagLabels} />
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
        employeeName={name || ''}
        employeeCode={username || ''}
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
