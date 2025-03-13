import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ActionsBottom from '~/src/components/order-detail/actions-bottom';
import Header from '~/src/components/order-detail/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-detail/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-detail/input-amount-popup';
import { PackageSizePicker } from '~/src/components/order-detail/package-size-picker';
import OrderPickProducts from '~/src/components/order-detail/products';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import {
  setCurrentId,
  setQuantityFromBarcode,
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { splitBarcode } from '~/src/core/utils/number';
import { barcodeCondition, getOrderPickProductsFlat } from '~/src/core/utils/order-bag';

const OrderPick = () => {
  const navigation = useNavigation();

  const [currentQr, setCurrentQr] = useState('');

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
  const scannedIds = useOrderPick.use.scannedIds();
  const quantityFromBarcode = useOrderPick.use.quantityFromBarcode();
  const isScanMoreProduct = useOrderPick.use.isScanMoreProduct();
  const orderDetail = useOrderPick.use.orderDetail();
  const deliveryType = orderDetail?.header?.deliveryType;

  const isShowPackageSizePicker = deliveryType !== 'CUSTOMER_PICKUP';


  const isEditManual = useOrderPick.use.isEditManual();
  const currentId = useOrderPick.use.currentId();

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

      const indexWithBarcode = orderPickProductsFlat?.findIndex(
        item => barcodeCondition(barcode, item?.refBarcodes)
      );

      if(indexWithBarcode === -1) {
        showMessage({
          message: `Mã ${barcode} vừa quét không nằm trong đơn hàng`,
          type: 'warning',
        });
        return;
      }

      let indexOfCodeScanned = -1;

      const barcodeWithPickedTime = orderPickProductsFlat?.findIndex(
        item => (barcodeCondition(barcode, item?.refBarcodes) && item?.pickedTime)
      );

      const indexOfCodeScannedWithoutPickedTime = orderPickProductsFlat?.findIndex(
        item =>  isEditManual ? 
        item?.id === currentId : 
        (barcodeCondition(barcode, item?.refBarcodes)) && !item?.pickedTime);

      if(indexOfCodeScannedWithoutPickedTime === -1) {
        indexOfCodeScanned = barcodeWithPickedTime;
      } else {
        indexOfCodeScanned = indexOfCodeScannedWithoutPickedTime;
      }
   
      const currentProduct = orderPickProductFlat?.[indexOfCodeScanned];;

      setCurrentId(currentProduct?.id)

      const currentBarcode: string | undefined = currentProduct?.barcode;
      const currentAmount = !isScanMoreProduct ? Number(currentProduct?.pickedQuantity) + 1 || 1 : 1;

      if (currentBarcode) {
        // setTimeout(() => {
          const newAmount = !scannedIds?.[currentProduct?.id] ? quantity || currentAmount : Number(quantityFromBarcode || 0) + Number(quantity || currentAmount);

          setSuccessForBarcodeScan(currentBarcode);
          setQuantityFromBarcode(Math.floor(Number(newAmount || 0) * 1000) / 1000);
          toggleShowAmountInput(true, orderPickProductFlat?.[indexOfCodeScanned]?.id);
        // }, 100);
      }
      
    },
    [
      orderPickProductsFlat,
      quantityFromBarcode,
      currentQr,
      toggleShowAmountInput,
      setSuccessForBarcodeScan,
      orderPickProductFlat,
      isScanMoreProduct,
      currentId,
      isEditManual,
      scannedIds,
      orderPickProductFlat,
    ]
  );


  if(!orderDetail) {
    return <SectionAlert><Text>Không tìm thấy đơn hàng</Text></SectionAlert>
  }

  return (
    <>
      <View className="flex-1 bg-gray-50 pt-2">
        {isShowPackageSizePicker && <PackageSizePicker />}
        <OrderPickProducts />
      </View>
      <ActionsBottom />
      {/* bottomshet */}
      {/* {isScanQrCodeProduct && ( */}
        <ScannerBox
          types={['codabar', 'code128']}
          visible={isScanQrCodeProduct}
          onSuccessBarcodeScanned={handleSuccessBarCode}
          onDestroy={() => {
            toggleScanQrCodeProduct(false);
          }}
        />
      {/* )} */}
      <OrderPickHeadeActionBottomSheet
        ref={headerAcrtionRef}
      />
      <InputAmountPopup />
    </>
  );
};

export default OrderPick;
