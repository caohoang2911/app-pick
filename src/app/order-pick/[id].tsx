import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '~/src/components/Badge';
import ButtonBack from '~/src/components/ButtonBack';
import Container from '~/src/components/Container';
import Header from '~/src/components/order-pick/header';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/order-pick-header-action-bottom-sheet';
import OrderPickProducts from '~/src/components/order-pick/order-pick-products';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { More2Fill } from '~/src/core/svgs';

const OrderPick = () => {
  const navigation = useNavigation();
  const { dismiss, dismissAll } = useBottomSheetModal();

  const [isScanner, setIsscanner] = useState(false);

  const headerAcrtionRef = useRef<any>();
  const inputAmountPopupRef = useRef<any>();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      // headerShown: true,
      // headerBackTitleVisible: false,
      // headerShadowVisible: false, // applied here,
      // headerStyle: {
      //   backgroundColor: 'white',
      //   shadowColor: 'transparent',
      //   borderBottomWidth: 0,
      //   borderBottomColor: 'transparent',
      // },
      // title: null,
      header: () => {
        return (
          <Header orderCode="OL350253" onClickHeaderAction={openHeaderAction} />
        );
      },
    });
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
        <View className="flex-1">
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
          inputAmountPopupRef.current?.present();
          setIsscanner(false);
        }}
      />
      <OrderPickHeadeActionBottomSheet
        ref={headerAcrtionRef}
        onClickAction={handleClickAction}
      />
      <InputAmountPopup
        ref={inputAmountPopupRef}
        productName="Nước ngọt Pepsi 330ml lốc 6 lon"
      />
    </>
  );
};

export default OrderPick;
