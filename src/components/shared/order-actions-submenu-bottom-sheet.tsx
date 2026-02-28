import { ORDER_STATUS } from '@/core/constants/order';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import {
  useCreateInvoiceFlow,
  useCreateInvoiceProcess,
} from '~/src/api/app-pick/use-create-invoice';
import { queryClient } from '~/src/api/shared/api-provider';
import { useAuth } from '~/src/core/store/auth';
import { useOrderDetailStore } from '~/src/core/store/order-detail';
import { EBikeLine } from '~/src/core/svgs';
import CODReceipt from '../CODReceipt';
import SBottomSheet from '../SBottomSheet';
import BookShipperActionsBottomsheet from './book-shipper-actions-bottomsheet';
import CancelBookShipperBottomsheet from './cancel-book-shipper-bottom-sheet';
import OrderDeliveryTypeBottomSheet from './order-delivery-type-bottom-sheet';
import OrderHistoryBottomSheet from './order-history-bottom-sheet';
import { setLoading } from '~/src/core/store/loading';

interface OrderActionsSubmenuBottomSheetProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  deliveryType?: string;
  orderCode?: string;
  status?: string;
  invoiceCode?: string;
}

const OrderActionsSubmenuBottomSheet = ({
  visible,
  setVisible,
  deliveryType,
  orderCode,
  status,
  invoiceCode,
}: OrderActionsSubmenuBottomSheetProps) => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const actionRef = useRef<any>();
  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const cancelBookShipperBottomsheetRef = useRef<any>();
  const orderDetail = useOrderDetailStore((s) =>
    code || orderCode ? s.orderDetails[code || orderCode || ''] : undefined,
  );
  const codAmount = orderDetail?.header?.codAmount;

  const [reprintWithCapture, setReprintWithCapture] = React.useState(false);

  const [orderDeliveryTypeVisible, setOrderDeliveryTypeVisible] =
    React.useState(false);
  const [orderHistoryVisible, setOrderHistoryVisible] = React.useState(false);

  const invalidateOrderDetail = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  }, []);

  const { mutate: reprintInvoice, data: reprintInvoiceData } =
    useCreateInvoiceProcess({
      successMessage: 'In lại hóa đơn thành công',
      onSuccess: () => {
        setReprintWithCapture(true);
        invalidateOrderDetail();
      },
    });
  const { mutate: createInvoiceFlow } = useCreateInvoiceFlow({
    onSuccess: async (orderCodeFromApi) => {
      await invalidateOrderDetail();
      if (!Number(codAmount)) {
        reprintInvoice({ orderCode: orderCodeFromApi });
      } else {
        setLoading(false);
      }
    },
  });

  const user = useAuth.use.userInfo();
  const { name, username } = user || {};

  const invoiceCodeFromAPI = reprintInvoiceData?.data?.invoiceCode;

  // Check if status is from STORE_PACKED onwards
  const canReprintInvoice = useMemo(() => {
    if (!status || !invoiceCode) return false;
    const allowedStatuses = [
      ORDER_STATUS.STORE_PACKED,
      ORDER_STATUS.BOOKED_SHIPPER,
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.COMPLETED,
    ];
    return allowedStatuses.includes(status as any);
  }, [status, invoiceCode]);

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const actions = useMemo(
    () => [
      {
        key: 'book-ahamove',
        title: 'Book tài xế',
        icon: <EBikeLine />,
      },
      {
        key: 'cancel-book-shipper',
        title: 'Huỷ tài xế',
        icon: (
          <MaterialCommunityIcons
            name="book-cancel-outline"
            size={24}
            color="black"
          />
        ),
      },
      {
        key: 'change-delivery-type',
        title: 'Đổi phương thức giao hàng',
        icon: <Ionicons name="swap-horizontal" size={24} color="black" />,
      },
      {
        key: 'reprint-invoice',
        title: 'In lại hóa đơn',
        icon: <MaterialIcons name="print" size={24} color="black" />,
        // enabled: canReprintInvoice,
        enabled: true,
      },
      {
        key: 'history-order',
        title: 'Lịch sử đơn hàng',
        icon: <MaterialIcons name="history" size={24} color="black" />,
      },
    ],
    [canReprintInvoice],
  );

  const renderItem = ({
    onClickAction,
    key,
    title,
    icon,
    enabled = true,
  }: {
    key: string;
    title: string | React.ReactNode;
    icon: React.ReactNode;
    onClickAction: (key: string) => void;
    enabled?: boolean;
  }) => {
    return (
      <Pressable
        onPress={() => onClickAction?.(key)}
        disabled={!enabled}
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
        style={{ opacity: enabled ? 1 : 0.5 }}
      >
        {icon}
        <Text className={`text-gray-300`}>{title}</Text>
      </Pressable>
    );
  };

  const handleClickAction = (key: string) => {
    setVisible(false);
    switch (key) {
      case 'book-ahamove':
        bookAhamoveActionsBottomsheetRef.current?.present();
        break;
      case 'cancel-book-shipper':
        cancelBookShipperBottomsheetRef.current?.present();
        break;
      case 'change-delivery-type':
        setOrderDeliveryTypeVisible(true);
        break;
      case 'reprint-invoice':
        setLoading(true);
        createInvoiceFlow({ orderCode: code || orderCode || '' });
        break;
      case 'history-order':
        setOrderHistoryVisible(true);
        break;
      default:
        break;
    }
  };

  const handleReceiptCaptureComplete = useCallback(
    (base64String: string) => {
      reprintInvoice({
        orderCode: code || orderCode || '',
        codReceiptBase64String: base64String.trim(),
      });
    },
    [code, orderCode, reprintInvoice],
  );

  const shouldEnableCapture =
    reprintWithCapture &&
    Number(codAmount) > 0 &&
    !!(invoiceCodeFromAPI || invoiceCode);

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        ref={actionRef}
        snapPoints={[360]}
        titleAlign="center"
        onClose={() => setVisible(false)}
      >
        {actions.map((action: any) => (
          <React.Fragment key={action.key}>
            {renderItem({
              ...action,
              onClickAction: handleClickAction,
              enabled: action.enabled !== undefined ? action.enabled : true,
            })}
          </React.Fragment>
        ))}
      </SBottomSheet>
      <CODReceipt
        orderCode={code}
        invoiceNumber={invoiceCodeFromAPI || invoiceCode || ''}
        codAmount={Number(codAmount)}
        employeeName={name || ''}
        employeeCode={username || ''}
        onCaptureComplete={handleReceiptCaptureComplete}
        enableCapture={shouldEnableCapture}
      />
      <BookShipperActionsBottomsheet ref={bookAhamoveActionsBottomsheetRef} />
      <CancelBookShipperBottomsheet
        orderCode={code || orderCode || ''}
        ref={cancelBookShipperBottomsheetRef}
      />
      <OrderDeliveryTypeBottomSheet
        setVisible={setOrderDeliveryTypeVisible}
        visible={orderDeliveryTypeVisible}
        deliveryType={deliveryType || null}
        orderCode={code || orderCode}
      />
      <OrderHistoryBottomSheet
        orderCode={code || orderCode || ''}
        setVisible={setOrderHistoryVisible}
        visible={orderHistoryVisible}
        orderDetail={orderDetail || {}}
      />
    </>
  );
};

export default OrderActionsSubmenuBottomSheet;
