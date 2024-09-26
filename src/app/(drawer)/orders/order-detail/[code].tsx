import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ActionsBottom from '~/src/components/order-pick/actions-bottom';
import Header from '~/src/components/order-pick/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickProducts from '~/src/components/order-pick/products';
import ScannerBox from '~/src/components/shared/ScannerBox';
import {
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';

const OrderPick = () => {
  const navigation = useNavigation();

  const [currentQr, setCurrentQr] = useState('');

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const headerAcrtionRef = useRef<any>();

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

  let timeout: any = useRef(null);

  const handleSuccessBarCode = useCallback(
    (result: BarcodeScanningResult) => {
      const codeScanned: string = result.data.toString();

      if (currentQr != codeScanned) {
        setCurrentQr(codeScanned);

        if (timeout.current) clearTimeout(timeout.current);

        timeout.current = setTimeout(() => {
          setCurrentQr('');
        }, 1000);

        if (!orderPickProducts[codeScanned]) {
          showMessage({
            message: 'Mã vừa quét không nằm trong đơn hàng',
            type: 'warning',
          });
          return;
        }
        setSuccessForBarcodeScan(result?.data);
        if (!isShowAmountInput) {
          toggleShowAmountInput(true);
        }
      }
    },
    [orderPickProducts, currentQr]
  );

  return (
    <>
      <View className="flex-1 bg-gray-50 pt-2">
        {/* TODO */}
        {/* {!isScanQrCodeProduct && shouldDisplayQrScan && (
          <ScanOnView onSuccessBarcodeScanned={handleSuccessBarCode} />
        )} */}
        <OrderPickProducts />
      </View>
      <ActionsBottom />
      {/* bottomshet */}
      {isScanQrCodeProduct && (
        <ScannerBox
          type="qr"
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleSuccessBarCode}
          onDestroy={() => {
            toggleScanQrCodeProduct(false);
          }}
        />
      )}
      <OrderPickHeadeActionBottomSheet
        ref={headerAcrtionRef}
      />
      <InputAmountPopup />
    </>
  );
};

export default OrderPick;
