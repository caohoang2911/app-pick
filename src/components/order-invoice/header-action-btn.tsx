import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useSelfShipping } from '~/src/api/app-pick/use-self-shipping';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { EBikeLine, More2Fill, TruckLine } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import BookAhamoveActionsBottomsheet from './book-ahamove-actions-bottomsheet';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { useCancelBookShipper } from '~/src/api/app-pick/use-cancel-book-shipper';

const actions = [
  {
    key: 'store-delivery',
    title: 'Store giao hàng',
    icon: <TruckLine />,
  },
  {
    key: 'book-ahamove',
    title: 'Book AhaMove',
    icon: <EBikeLine />,
  },
  {
    key: 'cancel-book-shipper',
    title: 'Cancel Book Shipper',
    icon: <TruckLine />,
  },
  {
    key: 'complete-order',
    title: 'Hoàn tất đơn hàng',
    icon: <EBikeLine />,
  },
];

const HeaderActionBtn = () => {
  const [visible, setVisible] = useState(false);
  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const { code } = useLocalSearchParams<{ code: string }>();

  // Store giao hàng
  const { isPending: isLoadingSelfShipping, mutate: selfShipping } = useSelfShipping(() => {
    hideAlert();
    setLoading(false)
  });

  // Hoàn thành đơn hàng
  const { isPending: isLoadingCompleteOrder, mutate: completeOrder } = useCompleteOrder(() => {
    hideAlert();
    setLoading(false);
  });

  // Huỷ đơn hàng
  const { isPending: isLoadingCancelBookShipper, mutate: cancelBookShipper } = useCancelBookShipper(() => {
    hideAlert();
    setLoading(false);
  });

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
        <Text className="text-gray-300">{title}</Text>
      </Pressable>
    );
  };

  const handleClickAction = (key: string) => {
    setVisible(false);
    switch (key) {
      case 'book-ahamove':
        bookAhamoveActionsBottomsheetRef.current?.present();
        break;
      case 'store-delivery':
        showAlert({
          title: 'Xác nhận store giao hàng',
          loading: isLoadingSelfShipping,
          onConfirm: () => {
            if(code) {
              setLoading(true);
              selfShipping({
                orderCode: code,
              });
            }
          },
        });
        break;
      case "cancel-book-shipper":
        if (!code) return;

        showAlert({
          title: 'Xác nhận huỷ book shipper',
          loading: isLoadingCancelBookShipper,
          onConfirm: () => {
            setLoading(true);
            cancelBookShipper({ orderCode: code });
          },
        });
        break;
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
      default:
        break;
    }
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        <More2Fill />
      </Pressable>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        titleAlign="center"
        onClose={() => setVisible(false)}
      >
        {actions.map((action) => renderItem({ ...action, onClickAction: handleClickAction }))}
      </SBottomSheet>
      <BookAhamoveActionsBottomsheet ref={bookAhamoveActionsBottomsheetRef} />
    </>
  )
}

export default HeaderActionBtn