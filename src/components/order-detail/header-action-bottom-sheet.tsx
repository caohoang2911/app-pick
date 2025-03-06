import Feather from '@expo/vector-icons/Feather';
import { router, useGlobalSearchParams } from 'expo-router';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { Linking, Pressable, Text, View } from 'react-native';
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
import { Badge } from '../Badge';
import SBottomSheet from '../SBottomSheet';

type Action = {
  key: string;
  title: string | React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
};

type Props = {};


const actions: Array<Action> = [
  {
    key: 'view-order',
    title: 'Thông tin đơn hàng',
    icon: <BillLine />,
  },
  {
    key: 'enter-bag-and-tem',
    title: 'Nhập số lượng túi và in tem',
    icon: <PrintLine />,
  },
  {
    key: 'scan-bag',
    title: 'Scan túi - Giao hàng',
    // disabled: status !== OrderStatusValue.STORE_PACKED,
    icon: <QRScanLine />,
  },
];

const OrderPickHeadeActionBottomSheet = forwardRef<any, Props>(
  ({ }, ref) => {
    const { code } = useGlobalSearchParams<{ code: string }>();
    const [visible, setVisible] = useState(false);

    const orderDetail = useOrderPick.use.orderDetail();

    const { customer } = orderDetail?.header || {};
    const { name, phone, membership } = customer || {};
    const { rank } = membership || {};

    const actionRef = useRef<any>();
  
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
          
          disabled={false}
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          <View className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4">
            {icon}
            <Text className="text-gray-300 font-medium">{title}</Text>
          </View>
        </Pressable>
      );
    };

    const handleClickAction = (key: string) => {
      switch (key) {
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
            <View className='bg-blue-50 rounded-full p-3'>
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
        ref={actionRef}
        snapPoints={[280]}
        onClose={() => {
          setVisible(false);
        }}
      >
        <View className="flex-1">
          {actions.map((action: Action) => renderItem({ ...action, onClickAction: action.disabled ? () => {} : handleClickAction, disabled: action.disabled || false }))}
        </View>
      </SBottomSheet>
    );
  }
);

export default OrderPickHeadeActionBottomSheet;
