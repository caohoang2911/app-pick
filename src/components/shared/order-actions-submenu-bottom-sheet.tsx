import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { EBikeLine } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import BookAhamoveActionsBottomsheet from './book-ahamove-actions-bottomsheet';
import CancelBookShipperBottomsheet from './cancel-book-shipper-bottom-sheet';
import OrderDeliveryTypeBottomSheet from './order-delivery-type-bottom-sheet';
import OrderHistoryBottomSheet from './order-history-bottom-sheet';

interface OrderActionsSubmenuBottomSheetProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  deliveryType?: string;
  orderCode?: string;
}

const OrderActionsSubmenuBottomSheet = ({
  visible,
  setVisible,
  deliveryType,
  orderCode,
}: OrderActionsSubmenuBottomSheetProps) => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const actionRef = useRef<any>();
  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const cancelBookShipperBottomsheetRef = useRef<any>();

  const [orderDeliveryTypeVisible, setOrderDeliveryTypeVisible] =
    React.useState(false);
  const [orderHistoryVisible, setOrderHistoryVisible] = React.useState(false);

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const actions = useMemo(
    () => [
      {
        key: 'book-ahamove',
        title: 'Book tài xế AhaMove',
        icon: <EBikeLine />,
      },
      {
        key: 'cancel-book-shipper',
        title: 'Huỷ tài xế AhaMove',
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
        key: 'history-order',
        title: 'Lịch sử đơn hàng',
        icon: <MaterialIcons name="history" size={24} color="black" />,
      },
    ],
    [],
  );

  const renderItem = ({
    onClickAction,
    key,
    title,
    icon,
  }: {
    key: string;
    title: string | React.ReactNode;
    icon: React.ReactNode;
    onClickAction: (key: string) => void;
  }) => {
    return (
      <Pressable
        onPress={() => onClickAction?.(key)}
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
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
      case 'history-order':
        setOrderHistoryVisible(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        ref={actionRef}
        snapPoints={[320]}
        titleAlign="center"
        onClose={() => setVisible(false)}
      >
        {actions.map((action: any) => (
          <React.Fragment key={action.key}>
            {renderItem({ ...action, onClickAction: handleClickAction })}
          </React.Fragment>
        ))}
      </SBottomSheet>
      <BookAhamoveActionsBottomsheet ref={bookAhamoveActionsBottomsheetRef} />
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
      />
    </>
  );
};

export default OrderActionsSubmenuBottomSheet;
