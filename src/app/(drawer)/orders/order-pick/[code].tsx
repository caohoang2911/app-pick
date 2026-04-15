import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import ActionsBottom from '~/src/components/order-pick/actions-bottom';
import Header from '~/src/components/order-pick/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickProducts from '~/src/components/order-pick/products';
import ReplacePickedProducts from '~/src/components/order-pick/replace-picked-products';
import { SectionAlert } from '~/src/components/SectionAlert';
import ScannerBox from '~/src/components/shared/ScannerBox';
import {
  setCurrentId,
  setIsPickedByManualBarcodeInput,
  setQuantityFromBarcode,
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  resetOrderPick,
  setCurrentCode,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { splitBarcode } from '~/src/core/utils/number';
import {
  barcodeCondition,
  handleScanBarcode,
} from '~/src/core/utils/order-bag';
import { BarcodeScanningResult } from '~/src/types/scanner';
import Loading from '~/src/components/Loading';

const OrderPick = () => {
  const navigation = useNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();

  const currentCode = useOrderPick.use.currentCode();

  const { isOrderDetailLoading, orderDetailError } =
    useOrderDetailForCode(code);

  useEffect(() => {
    if (!code) return;
    if (currentCode !== code) {
      // Chỉ reset khi chuyển sang đơn KHÁC.
      resetOrderPick();
      setCurrentCode(code);
    }
  }, [code, currentCode]);

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();

  const scannedIds = useOrderPick.use.scannedIds();
  const quantityFromBarcode = useOrderPick.use.quantityFromBarcode();
  const isScanMoreProduct = useOrderPick.use.isScanMoreProduct();

  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const isVisibleReplaceProduct = useOrderPick.use.isVisibleReplaceProduct();

  const isEditManual = useOrderPick.use.isEditManual();
  const currentId = useOrderPick.use.currentId();

  const headerAcrtionRef = useRef<any>();

  const orderPickProductsFlat = useOrderPickProductsFlat();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !isOrderDetailLoading,
      header: () => {
        return <Header onClickHeaderAction={openHeaderAction} />;
      },
    });
    // Chỉ phụ thuộc loading: `orderDetail` từ query đã ổn định khi có data; Header tự subscribe query theo route.
  }, [isOrderDetailLoading, navigation]);

  const openHeaderAction = () => {
    headerAcrtionRef.current?.present();
  };

  const handleSuccessBarCode = useCallback(
    (result: BarcodeScanningResult) => {
      const codeScanned: string = result.data.toString();

      const { barcode, quantity } = splitBarcode({ barcode: codeScanned });

      const indexWithBarcode = orderPickProductsFlat?.findIndex((item) =>
        barcodeCondition(barcode, item?.refBarcodes),
      );

      if (indexWithBarcode === -1) {
        showMessage({
          message: `Mã ${barcode} vừa quét không nằm trong đơn hàng`,
          type: 'warning',
        });
        return;
      }

      const indexOfCodeScanned = handleScanBarcode({
        orderPickProductsFlat,
        currentId,
        isEditManual,
        barcode,
      });

      const currentProduct = orderPickProductsFlat?.[indexOfCodeScanned];
      setCurrentId(currentProduct?.id);

      const currentBarcode: string | undefined = currentProduct?.barcode;
      const currentAmount = !isScanMoreProduct
        ? Number(currentProduct?.pickedQuantity) + 1 || 1
        : 1;

      if (currentBarcode) {
        setIsPickedByManualBarcodeInput(false);
        const newAmount = !scannedIds?.[currentProduct?.id]
          ? quantity || currentAmount
          : Number(quantityFromBarcode || 0) +
            Number(quantity || currentAmount);

        setSuccessForBarcodeScan(currentBarcode);
        setQuantityFromBarcode(
          Math.floor(Number(newAmount || 0) * 1000) / 1000,
        );
        toggleShowAmountInput(
          true,
          orderPickProductsFlat?.[indexOfCodeScanned]?.id,
        );
      } else {
        showMessage({
          message: `codeScanned: ${codeScanned} - indexOfCodeScanned: ${indexOfCodeScanned} - currentBarcode: ${currentBarcode} - barcode: ${barcode}`,
          type: 'warning',
        });
      }
    },
    [
      orderPickProductsFlat,
      quantityFromBarcode,
      toggleShowAmountInput,
      setSuccessForBarcodeScan,
      isScanMoreProduct,
      currentId,
      isEditManual,
      scannedIds,
      isShowAmountInput,
    ],
  );

  if (isOrderDetailLoading) {
    return <Loading description="Đang tải đơn hàng..." />;
  }

  if (orderDetailError) {
    return (
      <SectionAlert variant="danger">
        <Text>{orderDetailError}</Text>
      </SectionAlert>
    );
  }

  return (
    <>
      <View className="flex-1 bg-gray-50 pt-2">
        <OrderPickProducts key={code} />
      </View>
      <ActionsBottom />
      <ScannerBox
        isQRScanner={false}
        visible={isScanQrCodeProduct}
        onSuccessBarcodeScanned={handleSuccessBarCode}
        onDestroy={() => {
          toggleScanQrCodeProduct(false);
        }}
      />
      <OrderPickHeadeActionBottomSheet ref={headerAcrtionRef} />
      {isShowAmountInput ? <InputAmountPopup /> : null}
      {isVisibleReplaceProduct ? <ReplacePickedProducts /> : null}
    </>
  );
};

export default OrderPick;
