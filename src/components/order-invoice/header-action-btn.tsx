import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { MaterialIcons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useDriverAssignOrderToMe } from '~/src/api/app-pick-driver/useDriverAssignOrderToMe';
import { useDriverCancelMyOrderShipping } from '~/src/api/app-pick-driver/useDriverCancelMyOrderShipping';
import { queryClient } from '~/src/api/shared/api-provider';
import { ORDER_STATUS } from '~/src/contants/order';
import { useRoleDriver } from "~/src/core/hooks/useRole";
import { setLoading } from '~/src/core/store/loading';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import { More2Fill, QRScanLine } from '~/src/core/svgs';
import { OrderStatusValue } from '~/src/types/order';
import SBottomSheet from '../SBottomSheet';
import DeliverySelectionBottomsheet from '../shared/delivery-selection-bottomsheet';

const HeaderActionBtn = () => {
  const [visible, setVisible] = useState(false);
  const [deliverySelectionVisible, setDeliverySelectionVisible] = useState(false);
  const { code } = useLocalSearchParams<{ code: string }>();

  const { mutate: assignOrderToMe } = useDriverAssignOrderToMe(() => {
    queryClient.invalidateQueries({ queryKey: ['orderInvoice'] });
    showMessage({
      message: 'Gán đơn cho tôi thành công',
      type: 'success',
    });
  });

  const { mutate: cancelMyOrder } = useDriverCancelMyOrderShipping(() => {
    queryClient.invalidateQueries({ queryKey: ['orderInvoice'] });
    showMessage({
      message: 'Huỷ gán đơn cho tôi thành công',
      type: 'success',
    });
  });

  const isDriver = useRoleDriver();

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { status, deliveryType } = header || {};

  const isShipping = status === ORDER_STATUS.SHIPPING;
  const isStorePackaged = status === ORDER_STATUS.STORE_PACKED;  

  const actionRef = useRef<any>();

  const driverActions = [
    {
      key: 'assign-order-to-me',
      title: 'Gán đơn cho tôi',
      enabled: true,
      icon: <MaterialIcons name="person-add-alt" size={24} color="black" />
    },
    {
      key: 'unassign-order-to-me',
      title: 'Huỷ gán đơn book AhaMove',
      enabled: true,
      icon: <MaterialIcons name="person-remove-alt-1" size={24} color="black" />
    },
  ];

  const actions = useMemo(() => isDriver ? driverActions : [
    {
      key: 'scan-bag',
      title: 'Scan túi - Giao hàng',
      enabled: deliveryType === "SHIPPER_DELIVERY" || deliveryType == "CUSTOMER_PICKUP" || status === OrderStatusValue.BOOKED_SHIPPER,
      icon: <QRScanLine />,
    },
    {
      key: 'delivery-order',
      title: 'Vận chuyển',
      allowSubmenu: true,
      enabled: true,
      icon: <MaterialIcons name="delivery-dining" size={24} color="black" />,
    },
  ], [code, isShipping, isStorePackaged]);
  
  const renderItem = ({
    onClickAction,
    key,
    title,
    icon,
    enabled,
    allowSubmenu,
  }: {
    key: string;
    title: string | React.ReactNode;
    icon: React.ReactNode;
    enabled: boolean;
    allowSubmenu: boolean;
    onClickAction: (key: string) => void;
  }) => {
    return (
      <Pressable
        disabled={!enabled}
        onPress={() => onClickAction?.(key)}
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
        style={{
          backgroundColor: enabled ? ''  : 'rgba(0, 0, 0, 0.05)',
          opacity: enabled ? 1 : 0.3,
        }}
      >
        <View className="flex-row items-center gap-4 justify-between flex-1">
          <View className="flex-row items-center gap-4">
            {icon}
            <Text className={`text-gray-300`}>{title}</Text>
          </View>
          {allowSubmenu && <Entypo name="chevron-small-right" size={24} color="black" />}
        </View>
      </Pressable>
    );
  };

  const handleClickAction = (key: string) => {
    setVisible(false);
    switch (key) {
      case 'delivery-order':
        setDeliverySelectionVisible(true);
        break;
      case 'scan-bag':
        router.push(`orders/order-scan-to-delivery/${code}`);
        break;
      case 'assign-order-to-me':
        showAlert({
          title: 'Gán đơn cho tôi',
          message: 'Bạn có muốn gán đơn cho mình không?',
          onConfirm: () => {
            hideAlert();
            setLoading(true);
            assignOrderToMe({ orderCode: code });
          },
        });
        break;
      case 'unassign-order-to-me':
        showAlert({
          title: 'Huỷ gán đơn cho tôi',
          message: 'Bạn có muốn huỷ gán đơn, để book AhaMove không?',
          onConfirm: () => {
            setLoading(true);
            hideAlert();
            cancelMyOrder({ orderCode: code });
          },
        });
        break;
      case 'unassign-order-to-me':
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} className="px-1">
        <More2Fill width={20} height={20} />
      </Pressable>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        ref={actionRef}
        snapPoints={[250]}
        onClose={() => setVisible(false)}
      >
        {actions.map((action: any) => (
          <React.Fragment key={action.key}>
            {renderItem({ ...action, onClickAction: handleClickAction })}
          </React.Fragment>
        ))}
      </SBottomSheet>
      <DeliverySelectionBottomsheet
        orderDetail={orderInvoice}
        visible={deliverySelectionVisible}
        setVisible={setDeliverySelectionVisible}
      />
    </>
  )
}

export default HeaderActionBtn