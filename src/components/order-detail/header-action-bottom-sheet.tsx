import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useGlobalSearchParams } from 'expo-router';
import { useSaveOrderPickingAsDraft } from '~/src/api/app-pick/use-save-order-picking-as-draft';
import { setLoading } from '~/src/core/store/loading';
import { useOrderPick } from '~/src/core/store/order-pick';
import {
  BillLine,
  CloseLine,
  PrintLine,
  QRScanLine,
} from '~/src/core/svgs';
import SaveOutLine from '~/src/core/svgs/SaveOutline';
import SBottomSheet from '../SBottomSheet';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { queryClient } from '~/src/api/shared';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { OrderStatusValue } from '~/src/types/order';

type Action = {
  key: string;
  title: string | React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
};

type Props = {};

const OrderPickHeadeActionBottomSheet = forwardRef<any, Props>(
  ({ }, ref) => {
    const { code } = useGlobalSearchParams<{ code: string }>();
    const [visible, setVisible] = useState(false);

    const orderDetail = useOrderPick.use.orderDetail();

    const { deliveryType, status } = orderDetail?.header || {};

    const orderPickProducts = useOrderPick.use.orderPickProducts();
    
    const actionRef = useRef<any>();

    const { mutate: saveOrderPickingAsDraft } = useSaveOrderPickingAsDraft();

    const { isPending: isLoadingCompleteOrder, mutate: completeOrder } = useCompleteOrder(() => {
      hideAlert();
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
    });
  
    const handleCompleteOrder = () => {
      if (!code) return;
  
      showAlert({
        title: 'Xác nhận hoàn tất đơn hàng hàng',
        loading: isLoadingCompleteOrder,
        onConfirm: () => {
          setLoading(true);
          completeOrder({ orderCode: code });
        },
      });
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            actionRef.current?.present();
            setVisible(!visible);
          },
        };
      },
      []
    );

    const actions: Array<Action> = useMemo(() => [
      {
        key: 'view-order',
        title: 'Thông tin đơn hàng',
        icon: <BillLine />,
      },
      {
        key: 'enter-bag-and-tem',
        title: 'Nhập số lượng túi và in tem',
        disabled: status !== OrderStatusValue.STORE_PICKING,
        icon: <PrintLine />,
      },
      {
        key: 'scan-bag',
        title: 'Scan túi - Giao hàng',
        disabled: true,
        icon: <QRScanLine />,
      },
      {
        key: 'save-draft',
        title: 'Lưu tạm',
        icon: <SaveOutLine />,
      },
      {
        key: 'complete-order',
        title: 'Hoàn tất đơn hàng',
        disabled: deliveryType === 'SHIPPER_DELIVERY',
        icon: <MaterialIcons name="done" size={24} color="black" />,
      },
    ], [code, deliveryType, status]);

    const renderItem = ({
      onClickAction,
      key,
      title,
      icon,
      disabled,
    }: Action & { onClickAction: (key: string) => void }) => {
      return (
        <Pressable
          onPress={() => onClickAction?.(key)}
          className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          {icon}
          <Text className="text-gray-300 font-medium">{title}</Text>
        </Pressable>
      );
    };

    const handleClickAction = (key: string) => {
      switch (key) {
        case 'save-draft':
          setLoading(true);
          saveOrderPickingAsDraft({ pickedItems: Object.values(orderPickProducts).map((item) => ({
            ...item,
            name: item.name || '',
            quantity: item.quantity || 0,
            barcode: item.barcode || '',
            pickedQuantity: item.pickedQuantity || 0,
            pickedError: item.pickedError || '',
            pickedNote: item.pickedNote || '',
          })), orderCode: code,});
          break;
        case 'view-order':
          router.push(`orders/order-invoice/${code}`);
          break;
        case 'complete-order':
          handleCompleteOrder();
          break;
        case 'enter-bag-and-tem':
          router.push(`orders/order-bags/${code}`);
          break;
        default:
          break;
      }
      actionRef.current?.dismiss();

    };

    return (
      <SBottomSheet
        visible={visible}
        title="Thao tác" ref={actionRef}>
        {actions.map((action: Action) => renderItem({ ...action, onClickAction: handleClickAction, disabled: action.disabled || false }))}
      </SBottomSheet>
    );
  }
);

export default OrderPickHeadeActionBottomSheet;
