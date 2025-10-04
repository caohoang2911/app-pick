import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { ORDER_STATUS } from '~/src/contants/order';
import { EBikeLine } from '~/src/core/svgs';
import { OrderDetail } from '~/src/types/order-pick';
import SBottomSheet from '../SBottomSheet';
import BookAhamoveActionsBottomsheet from './book-ahamove-actions-bottomsheet';
import CancelBookShipperBottomsheet from './cancel-book-shipper-bottom-sheet';

const DeliverySelectionBottomsheet = ({
  visible,
  orderDetail,
  setVisible,
}: {
  visible: boolean;
  orderDetail: OrderDetail;
  setVisible: (visible: boolean) => void;
}) => {

  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const cancelBookShipperBottomsheetRef = useRef<any>();
  const { code } = useLocalSearchParams<{ code: string }>();

  const { header } = orderDetail || {};
  const { status, deliveryType } = header || {};

  const actionRef = useRef<any>();

  const isStoreDelivery = deliveryType === "APARTMENT_COMPLEX_DELIVERY" || deliveryType === "OFFLINE_HOME_DELIVERY";

  const actions =  [
    {
      key: 'start-store-delivery',
      title: status === ORDER_STATUS.SHIPPING ? 'Store hoàn tất giao hàng' : 'Store tự giao hàng',
      disabled: !isStoreDelivery,
      icon: <AntDesign name="user" size={24} color="black" />,
    },
    {
      key: 'book-ahamove',
      title: 'Book tài xế AhaMove',
      icon: <EBikeLine />,
    },
    {
      key: 'cancel-book-shipper',
      title: 'Huỷ tài xế AhaMove',
      icon: <MaterialCommunityIcons name="book-cancel-outline" size={24} color="black" />
    },
  ];

  const renderItem = ({
    onClickAction,
    key,
    title,
    icon,
    disabled,
  }: {
    key: string;
    title: string | React.ReactNode;
    icon: React.ReactNode;
    disabled: boolean;
    onClickAction: (key: string) => void;
  }) => {
    return (
      <Pressable
        disabled={disabled}
        onPress={() => onClickAction?.(key)}
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
        style={{
          backgroundColor: disabled ? 'rgba(0, 0, 0, 0.05)' : 'white',
          opacity: disabled ? 0.3 : 1,
        }}
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
      case 'start-store-delivery':
        if(status !== ORDER_STATUS.SHIPPING) {
          router.push(`/orders/store-start-order-scan-to-delivery/${code}`);
        } else {
          router.push(`/orders/store-complete-order-scan-to-delivery/${code}`);
        }
        break;
      case "cancel-book-shipper":
        cancelBookShipperBottomsheetRef.current?.present();
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
      <CancelBookShipperBottomsheet orderCode={code} ref={cancelBookShipperBottomsheetRef} />
    </>
  )
}

export default DeliverySelectionBottomsheet;