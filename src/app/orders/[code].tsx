import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useRef } from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Container from '~/src/components/Container';
import ActionBottom from '~/src/components/order-pick/action-bottom';
import Header from '~/src/components/order-pick/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickProducts from '~/src/components/order-pick/products';
import ScannerBox from '~/src/components/shared/ScannerBox';
import {
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  useOrderPick,
} from '~/src/core/store/order-pick';

const OrderPick = () => {
  const navigation = useNavigation();
  const { dismiss } = useBottomSheetModal();

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();

  const headerAcrtionRef = useRef<any>();
  const inputAmountPopupRef = useRef<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => {
        return <Header onClickHeaderAction={openHeaderAction} />;
      },
    });
  }, []);

  const openHeaderAction = () => {
    headerAcrtionRef.current?.present();
  };

  const handleClickAction = (key: string) => {
    dismiss();
  };

  return (
    <>
      <Container>
        <View className="flex-1">
          <OrderPickProducts />
        </View>
      </Container>
      <ActionBottom />
      {/* bottomshet */}
      <ScannerBox
        type="qr"
        visible={isScanQrCodeProduct}
        onSuccessBarcodeScanned={(result) => {
          if (!orderPickProducts[result?.data]) {
            showMessage({
              message: 'Mã vừa quét không nằm trong đơn hàng',
              type: 'warning',
            });
            return;
          }
          inputAmountPopupRef.current?.present();
          setSuccessForBarcodeScan(result?.data);
        }}
        onDestroy={() => {
          toggleScanQrCodeProduct(false);
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
