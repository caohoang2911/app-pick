import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Container from '~/src/components/Container';
import { Input } from '~/src/components/Input';
import OrderPickHeader from '~/src/components/order-pick/order-pick-header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/order-pick-header-action-bottom-sheet';
import OrderPickProducts from '~/src/components/order-pick/order-pick-products';
import ScannerBox from '~/src/components/shared/ScannerBox';

const OrderPick = () => {
  const navigation = useNavigation();
  const { dismiss, dismissAll } = useBottomSheetModal();

  const [isScanner, setIsscanner] = useState(false);

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

  const handleScan = () => {
    setIsscanner(true);
  };

  return (
    <>
      <Container>
        <View className="mt-4 flex-1">
          <View>
            <OrderPickHeader
              onClickHeaderAction={openHeaderAction}
              orderCode="OL100100"
            />
            <View className="mt-4">
              <Input className="flex-grow" placeholder="SKU, tên sản phẩm" />
            </View>
          </View>
          <OrderPickProducts onScan={handleScan} />
        </View>
      </Container>
      {/* bottomshet */}
      <ScannerBox
        type="qr"
        visible={isScanner}
        onSuccessBarcodeScanned={(result) => {
          alert(JSON.stringify(result));
        }}
        onDestroy={() => {
          setIsscanner(false);
        }}
      />
      <OrderPickHeadeActionBottomSheet
        ref={headerAcrtionRef}
        onClickAction={handleClickAction}
      />
    </>
  );
};

export default OrderPick;
