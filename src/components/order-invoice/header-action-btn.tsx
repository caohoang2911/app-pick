import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useSelfShipping } from '~/src/api/app-pick/use-self-shipping';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { EBikeLine, More2Fill, TruckLine } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import BookAhamoveActionsBottomsheet from './book-ahamove-actions-bottomsheet';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { queryClient } from '~/src/api/shared/api-provider';

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
];

const HeaderActionBtn = () => {
  const [visible, setVisible] = useState(false);
  const bookAhamoveActionsBottomsheetRef = useRef<any>();
  const { code } = useLocalSearchParams<{ code: string }>();

  const actionRef = useRef<any>();

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

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        <More2Fill />
      </Pressable>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        ref={actionRef}
        snapPoints={[250]}
        titleAlign="center"
        onClose={() => setVisible(false)}
      >
        {actions.map((action) => (
          <React.Fragment key={action.key}>
            {renderItem({ ...action, onClickAction: handleClickAction })}
          </React.Fragment>
        ))}
      </SBottomSheet>
      <BookAhamoveActionsBottomsheet ref={bookAhamoveActionsBottomsheetRef} />
    </>
  )
}

export default HeaderActionBtn