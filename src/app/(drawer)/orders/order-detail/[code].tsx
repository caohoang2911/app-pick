import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import { isEmpty } from 'lodash';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ActionsBottom from '~/src/components/order-pick/actions-bottom';
import Header from '~/src/components/order-pick/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickProducts from '~/src/components/order-pick/products';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import {
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { splitBarcode } from '~/src/core/utils/number';

const OrderPick = () => {
  const navigation = useNavigation();

  const [currentQr, setCurrentQr] = useState('');

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();

  const orderDetail = useOrderPick.use.orderDetail();
  const { productItems } = orderDetail?.delivery || {};

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

      const { barcode } = splitBarcode({ barcode: codeScanned });
      setCurrentQr(barcode);

      if (timeout.current) clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        setCurrentQr('');
      }, 1000);

      const indexOfCodeScanned = Object.keys(orderPickProducts || {})?.findIndex(key => barcode?.startsWith(key));

      if (indexOfCodeScanned === -1) {
        showMessage({
          message: `Mã ${barcode} vừa quét không nằm trong đơn hàng`,
          type: 'warning',
        });
      } else {
        const currentBarcode: string | undefined = productItems?.[indexOfCodeScanned]?.barcode;
        if (currentBarcode) {
          setSuccessForBarcodeScan(currentBarcode);
          toggleShowAmountInput(true);
        }
      }
    },
    [orderPickProducts, currentQr, toggleShowAmountInput, setSuccessForBarcodeScan, productItems]
  );

  if(!orderDetail) {
    return <SectionAlert><Text>Không tìm thấy đơn hàng</Text></SectionAlert>
  }

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
