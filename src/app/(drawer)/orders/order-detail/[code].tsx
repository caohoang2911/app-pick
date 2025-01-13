import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ActionsBottom from '~/src/components/order-detail/actions-bottom';
import Header from '~/src/components/order-detail/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-detail/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-detail/input-amount-popup';
import OrderPickProducts from '~/src/components/order-detail/products';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { PackageSizePicker } from '~/src/components/order-detail/package-size-picker';
import {
  setQuantityFromBarcode,
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { splitBarcode } from '~/src/core/utils/number';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { add } from 'lodash';

const OrderPick = () => {
  const navigation = useNavigation();

  const [currentQr, setCurrentQr] = useState('');

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
  const isNewScan = useOrderPick.use.isNewScan();

  const orderDetail = useOrderPick.use.orderDetail();

  const orderPickProductFlat = getOrderPickProductsFlat(orderPickProducts);

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

      const { barcode, quantity } = splitBarcode({ barcode: codeScanned });
      setCurrentQr(barcode);

      if (timeout.current) clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        setCurrentQr('');
      }, 1000);

      const indexOfCodeScanned = orderPickProductsFlat?.findIndex(item => barcode === item?.barcode || barcode === item?.baseBarcode);

      if (indexOfCodeScanned === -1) {
        showMessage({
          message: `Mã ${barcode} vừa quét không nằm trong đơn hàng`,
          type: 'warning',
        });
      } else {
        const currentBarcode: string | undefined = orderPickProductFlat?.[indexOfCodeScanned]?.barcode;
        const currentAmount = orderPickProductFlat?.[indexOfCodeScanned]?.pickedQuantity || orderPickProductFlat?.[indexOfCodeScanned]?.quantity;

        console.log('currentAmount', currentAmount);
        console.log('quantity', quantity);

        console.log('newAmount', (Number(currentAmount) + (Number(quantity) || 0)).toFixed(2));

        if (currentBarcode) {
          const newAmount = isNewScan ? quantity : (Number(currentAmount) + (Number(quantity) || 0)).toFixed(2);

          setSuccessForBarcodeScan(currentBarcode);
          setQuantityFromBarcode(Number(newAmount || 0));
          toggleShowAmountInput(true);
        }
      }
    },
    [orderPickProductsFlat, currentQr, toggleShowAmountInput, setSuccessForBarcodeScan, orderPickProductFlat]
  );

  if(!orderDetail) {
    return <SectionAlert><Text>Không tìm thấy đơn hàng</Text></SectionAlert>
  }

  return (
    <>
      <View className="flex-1 bg-gray-50 pt-2">
        <PackageSizePicker />
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
