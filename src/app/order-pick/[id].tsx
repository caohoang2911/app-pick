import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useRef } from 'react';
import { View } from 'react-native';
import Container from '~/src/components/Container';
import { Input } from '~/src/components/Input';
import OrderPickHeader from '~/src/components/order-pick/order-pick-header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/order-pick-header-action-bottom-sheet';

const OrderPick = () => {
  const navigation = useNavigation();
  const { dismiss, dismissAll } = useBottomSheetModal();

  const headerAcrtionRef = useRef<any>();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const openHeaderAction = () => {
    if (headerAcrtionRef.current?.present()) {
      dismiss();
    } else {
      headerAcrtionRef.current?.present();
    }
  };

  const handleClickAction = (key: string) => {
    dismiss();
  };

  return (
    <>
      <Container>
        <View className="mt-4 flex-1">
          <OrderPickHeader
            onClickHeaderAction={openHeaderAction}
            orderCode="OL100100"
          />
          <View className="mt-4">
            <Input className="flex-grow" placeholder="SKU, tên sản phẩm" />
          </View>
        </View>
        <OrderPickHeadeActionBottomSheet
          ref={headerAcrtionRef}
          onClickAction={handleClickAction}
        />
      </Container>

      {/* bottomshet */}
    </>
  );
};

export default OrderPick;
