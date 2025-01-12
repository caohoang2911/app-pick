import { router, useGlobalSearchParams } from 'expo-router';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

import { Linking, Pressable, Text, View } from 'react-native';
import { useSaveOrderPickingAsDraft } from '~/src/api/app-pick/use-save-order-picking-as-draft';
import { setLoading } from '~/src/core/store/loading';
import { useOrderPick } from '~/src/core/store/order-pick';
import {
  BillLine,
  PrintLine,
  QRScanLine
} from '~/src/core/svgs';
import SaveOutLine from '~/src/core/svgs/SaveOutline';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { OrderStatusValue } from '~/src/types/order';
import SBottomSheet from '../SBottomSheet';
import { Badge } from '../Badge';

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

    const { deliveryType, status, fulfillError, customer } = orderDetail?.header || {};
    const { name, phone, membership } = customer || {};
    const { rank } = membership || {};

    const orderPickProducts = useOrderPick.use.orderPickProducts();
    const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
    
    const actionRef = useRef<any>();

    const { mutate: saveOrderPickingAsDraft } = useSaveOrderPickingAsDraft();
  
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
        disabled: Boolean(status !== OrderStatusValue.STORE_PACKED || fulfillError != null),
        icon: <PrintLine />,
      },
      {
        key: 'scan-bag',
        title: 'Scan túi - Giao hàng',
        // disabled: status !== OrderStatusValue.STORE_PACKED,
        icon: <QRScanLine />,
      },
      {
        key: 'save-draft',
        title: 'Lưu tạm',
        disabled: status !== OrderStatusValue.STORE_PICKING,
        icon: <SaveOutLine />,
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
          disabled={false}
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
          saveOrderPickingAsDraft({ pickedItems: orderPickProductsFlat, orderCode: code,});
          break;
        case 'view-order':
          router.push(`orders/order-invoice/${code}`);
          break;
        case 'scan-bag':
          router.push(`orders/order-scan-to-delivery/${code}`);
          break;
        case 'enter-bag-and-tem':
          router.push(`orders/order-bags/${code}`);
          break;
        default:
          break;
      }
      actionRef.current?.dismiss();

    };

    const renderExtraTitle = () => {
      return (
        <View className='flex flex-row justify-between items-center w-100 mt-2'> 
          <View className='flex flex-row gap-2 items-center'>
            <Feather name="user" size={20} color="black" />
            <Text>{name}</Text>
            {rank && <Badge label={rank} />}
          </View>
          <Pressable onPress={() => {
            Linking.openURL(`tel:${phone}`);
          }}>
            <View className='bg-blue-50 rounded-full p-2'>
              <Feather name="phone-call" size={16} color="black" />
            </View>
          </Pressable>
        </View>
      );
    };

    return (
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        extraTitle={renderExtraTitle()}
        ref={actionRef}>
        {actions.map((action: Action) => renderItem({ ...action, onClickAction: handleClickAction, disabled: action.disabled || false }))}
      </SBottomSheet>
    );
  }
);

export default OrderPickHeadeActionBottomSheet;
