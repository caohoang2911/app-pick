import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { useSelfShipping } from '~/src/api/app-pick/use-self-shipping';
import { queryClient } from '~/src/api/shared/api-provider';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { EBikeLine, More2Fill, TruckLine } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import BookAhamoveActionsBottomsheet from './book-ahamove-actions-bottomsheet';
import CancelBookShipperBottomsheet from './cancel-book-shipper-bottom-sheet';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import { ORDER_STATUS } from '~/src/contants/order';

const HeaderActionBtn = () => {
  const [visible, setVisible] = useState(false);
  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const cancelBookShipperBottomsheetRef = useRef<any>();
  const { code } = useLocalSearchParams<{ code: string }>();

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { status } = header || {};

  const isShipping = status === ORDER_STATUS.SHIPPING;
  const isStorePackaged = status === ORDER_STATUS.STORE_PACKED;  

  const actionRef = useRef<any>();

  const actions = useMemo(() => [
    {
      key: 'start-store-delivery',
      title: 'Store bắt đầu giao hàng',
      disabled: !isStorePackaged,
      icon: <TruckLine />,
    },
    {
      key: 'complete-store-delivery',
      title: 'Store hoàn tất giao hàng',
      disabled: !isShipping,
      icon: <TruckLine />,
    },
    {
      key: 'book-ahamove',
      title: 'Book tài xế AhaMove',
      icon: <EBikeLine />,
    },
    {
      key: 'cancel-book-shipper',
      title: 'Huỷ tài xế AhaMove',
      icon: <TruckLine />,
    },
  ], [code, isShipping, isStorePackaged]);
  

  // Store giao hàng
  const { isPending: isLoadingSelfShipping, mutate: selfShipping } = useSelfShipping(() => {
    hideAlert();
    setLoading(false)
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  });

  // Hoàn thành đơn hàng
  const { isPending: isLoadingCompleteOrder, mutate: completeOrder } = useCompleteOrder(() => {
    hideAlert();
    setLoading(false);
  });

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
        }}
      >
        {icon}
        <Text className={`text-gray-300 ${disabled ? 'opacity-50' : ''}`}>{title}</Text>
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
        router.push(`/orders/store-start-order-scan-to-delivery/${code}`);
        break;
      case 'complete-store-delivery':
        router.push(`/orders/store-complete-order-scan-to-delivery/${code}`);
        break;
      // case 'store-delivery':
      //   showAlert({
      //     title: 'Xác nhận store giao hàng',
      //     loading: isLoadingSelfShipping,
      //     onConfirm: () => {
      //       if(code) {
      //         setLoading(true);
      //         selfShipping({
      //           orderCode: code,
      //         });
      //       }
      //     },
      //   });
      //   break;
      case "complete-order":
        if (!code) return;

        showAlert({
          title: 'Xác nhận đã giao hàng',
          loading: isLoadingCompleteOrder,
          onConfirm: () => {
            setLoading(true);
            completeOrder({ orderCode: code });
          },
        });
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
      <Pressable onPress={() => setVisible(true)} className="px-1">
        <More2Fill width={20} height={20} />
      </Pressable>
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

export default HeaderActionBtn