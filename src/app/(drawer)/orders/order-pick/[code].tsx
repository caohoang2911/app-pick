import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useRef } from 'react';
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
import ScannerBox from '~/src/components/shared/scanner-box';
import {
  setCurrentId,
  setIsPickedByManualBarcodeInput,
  setQuantityFromBarcode,
  setSuccessForBarcodeScan,
  appendWeightRangeScanKg,
  setScanMoreProduct,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { useOrderStatusAutoRefresh } from '~/src/core/hooks/useOrderStatusAutoRefresh';
import { splitBarcode } from '~/src/core/utils/number';
import {
  handleScanBarcode,
  resolvePickScanBarcode,
} from '~/src/core/utils/order-bags';
import { BarcodeScanningResult } from '~/src/types/scanner';
import Loading from '~/src/components/Loading';
import { isWeightRangeProduct as getIsWeightRangeProduct } from '~/src/components/order-pick/weight-range-line-items';

const OrderPick = () => {
  const navigation = useNavigation();
  const { code } = useLocalSearchParams<{ code: string }>();

  const { isOrderDetailLoading, orderDetailError } =
    useOrderDetailForCode(code);

  useOrderStatusAutoRefresh(code);

  // Reset + hydrate store theo đơn được chuyển vào products.tsx (useFocusEffect) để
  // 2 việc này chạy ATOMIC, chỉ cho màn đang focus — tránh ping-pong currentCode
  // giữa 2 màn order-pick (noti push) và tránh wipe-sau-hydrate khi back đơn cũ.

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

      const { barcode: rawBarcode, quantity } = splitBarcode({
        barcode: codeScanned,
      });

      const barcode = resolvePickScanBarcode(rawBarcode, orderPickProductsFlat);

      if (!barcode) {
        showMessage({
          message: `Mã ${rawBarcode} vừa quét không nằm trong đơn hàng`,
          type: 'warning',
        });
        return;
      }

      const indexOfCodeScanned = handleScanBarcode({
        orderPickProductsFlat,
        currentId,
        isEditManual,
        isScanMoreProduct,
        barcode,
      });

      const currentProduct = orderPickProductsFlat?.[indexOfCodeScanned];
      setCurrentId(currentProduct?.id);

      const isWeightRangeProduct = getIsWeightRangeProduct(currentProduct);
      const weightRange = currentProduct?.orderQuantityConversion?.weightRange;
      if (weightRange?.length === 2 && quantity) {
        const [minWeight, maxWeight] = weightRange;
        if (quantity < minWeight || quantity > maxWeight) {
          showMessage({
            message: `SP ${currentProduct?.name} chỉ được pick nằm trong khoảng trọng lượng ${minWeight} - ${maxWeight} KG`,
            type: 'warning',
          });
          return;
        }
      }
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
        const amountForBarcode = isWeightRangeProduct ? quantity : newAmount;

        setSuccessForBarcodeScan(currentBarcode);
        setQuantityFromBarcode(
          Math.floor(Number(amountForBarcode || 0) * 1000) / 1000,
        );
        if (isWeightRangeProduct && amountForBarcode != null) {
          appendWeightRangeScanKg(amountForBarcode);
        }
        if (isScanMoreProduct) {
          setScanMoreProduct(false);
        }
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
      <View className="flex-1 bg-gray-50 pt-3">
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
      <InputAmountPopup />
      {isVisibleReplaceProduct ? <ReplacePickedProducts /> : null}
    </>
  );
};

export default OrderPick;
