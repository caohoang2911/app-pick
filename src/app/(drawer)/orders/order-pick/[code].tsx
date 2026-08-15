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
  getIsShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { useOrderStatusAutoRefresh } from '~/src/core/hooks/useOrderStatusAutoRefresh';
import { usePdaScanTarget } from '~/src/core/hooks/usePdaScanTarget';
import { splitBarcode } from '~/src/core/utils/number';
import {
  handleScanBarcode,
  barcodeCondition,
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
    (result: BarcodeScanningResult, scanMoreOverride?: boolean) => {
      const codeScanned: string = result.data.toString();

      const { barcode: rawBarcode, quantity } = splitBarcode({
        barcode: codeScanned,
      });

      const barcode = resolvePickScanBarcode(rawBarcode, orderPickProductsFlat);

      // Warning khi quét: lý do ở nội dung chính, chuỗi máy quét trả về (nguyên bản,
      // còn cả phần số lượng/trọng lượng nếu có) tách xuống chip `codeLine` để NV đối chiếu.
      const showScanWarning = (reason: string) => {
        showMessage({
          message: reason,
          codeLine: `Mã quét được: ${codeScanned}`,
          type: 'warning',
        });
      };

      // Snapshot cờ trong lần quét này — setState không đổi biến local ngay.
      // PDA không cần bấm nút mở camera: popup số lượng đang mở đồng nghĩa với
      // "Pick thêm"; popup đóng luôn là scan thường. Camera giữ nguyên cờ do
      // action mở ScannerBox thiết lập.
      let scanMore = scanMoreOverride ?? isScanMoreProduct;
      if (scanMore && currentId == null) {
        setScanMoreProduct(false);
        scanMore = false;
      }

      // Pick thêm: chỉ cho quét đúng barcode của SP đang mở.
      if (scanMore && currentId != null) {
        const pickMoreProduct = orderPickProductsFlat.find(
          (item) => item?.id === currentId,
        );

        if (!barcode) {
          showScanWarning('Mã vừa quét không nằm trong đơn hàng');
          setScanMoreProduct(false);
          return;
        }

        if (!barcodeCondition(barcode, pickMoreProduct?.refBarcodes)) {
          showScanWarning('Mã vừa quét khác barcode sản phẩm đang pick thêm');
          setScanMoreProduct(false);
          return;
        }
      } else if (!barcode) {
        showScanWarning('Mã vừa quét không nằm trong đơn hàng');
        return;
      }

      const indexOfCodeScanned = handleScanBarcode({
        orderPickProductsFlat,
        currentId,
        isEditManual,
        isScanMoreProduct: scanMore,
        barcode: barcode as string,
      });

      if (indexOfCodeScanned === -1) {
        showScanWarning(
          scanMore
            ? 'Mã vừa quét khác barcode sản phẩm đang pick thêm'
            : 'Mã vừa quét không nằm trong đơn hàng',
        );
        if (scanMore) {
          setScanMoreProduct(false);
        }
        return;
      }

      const currentProduct = orderPickProductsFlat?.[indexOfCodeScanned];
      if (!currentProduct?.id) {
        if (scanMore) {
          setScanMoreProduct(false);
        }
        return;
      }

      setCurrentId(currentProduct.id);

      const isWeightRangeProduct = getIsWeightRangeProduct(currentProduct);
      const weightRange = currentProduct?.orderQuantityConversion?.weightRange;
      if (weightRange?.length === 2 && quantity) {
        const [minWeight, maxWeight] = weightRange;
        if (quantity < minWeight || quantity > maxWeight) {
          showScanWarning(
            `SP ${currentProduct?.name} chỉ được pick nằm trong khoảng trọng lượng ${minWeight} - ${maxWeight} KG`,
          );
          if (scanMore) {
            setScanMoreProduct(false);
          }
          return;
        }
      }
      const currentBarcode: string | undefined = currentProduct?.barcode;
      const currentAmount = !scanMore
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
        if (scanMore) {
          setScanMoreProduct(false);
        }
        toggleShowAmountInput(
          true,
          orderPickProductsFlat?.[indexOfCodeScanned]?.id,
        );
      } else {
        if (scanMore) {
          setScanMoreProduct(false);
        }
        showMessage({
          message: `codeScanned: ${codeScanned} - indexOfCodeScanned: ${indexOfCodeScanned} - currentBarcode: ${currentBarcode} - barcode: ${barcode}`,
          type: 'warning',
        });
      }
    },
    [
      orderPickProductsFlat,
      quantityFromBarcode,
      isScanMoreProduct,
      currentId,
      isEditManual,
      scannedIds,
    ],
  );

  const handlePdaSuccessBarCode = useCallback(
    (result: BarcodeScanningResult) =>
      handleSuccessBarCode(result, getIsShowAmountInput()),
    [handleSuccessBarCode],
  );

  // Quét bằng máy PDA (đầu đọc laser) dùng chung handler với camera, không cần mở camera.
  usePdaScanTarget(handlePdaSuccessBarCode);

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
          setScanMoreProduct(false);
        }}
      />
      <OrderPickHeadeActionBottomSheet ref={headerAcrtionRef} />
      <InputAmountPopup />
      {isVisibleReplaceProduct ? <ReplacePickedProducts /> : null}
    </>
  );
};

export default OrderPick;
