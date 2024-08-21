import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { BarcodeScanningResult } from 'expo-camera';
import { useGlobalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ActionBottom from '~/src/components/order-pick/action-bottom';
import Header from '~/src/components/order-pick/header';
import OrderPickHeadeActionBottomSheet from '~/src/components/order-pick/header-action-bottom-sheet';
import InputAmountPopup from '~/src/components/order-pick/input-amount-popup';
import OrderPickProducts from '~/src/components/order-pick/products';
import ScanOnView from '~/src/components/order-pick/scan-on-view';
import ScannerBox from '~/src/components/shared/ScannerBox';
import useCarmera from '~/src/core/hooks/useCarmera';
import {
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-detail';

const OrderPick = () => {
  const navigation = useNavigation();
  const { dismiss } = useBottomSheetModal();

  const [currentQr, setCurrentQr] = useState('');

  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();

  const headerAcrtionRef = useRef<any>();
  const inputAmountPopupRef = useRef<any>();

  const { code } = useGlobalSearchParams<{ code: string }>();
  const data: any = useQuery({ queryKey: ['orderDetail', code] });

  const orderDetail: OrderDetail = data?.data?.data || {};
  const { header } = orderDetail;
  const { status } = header || {};

  const shouldDisplayQrScan = ['STORE_PICKING'].includes(status as OrderStatus);

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

  const { permission, facing, requestPermission, toggleCameraFacing } =
    useCarmera();

  let timeout: any = useRef(null);

  const handleSuccessBarCode = useCallback(
    (result: BarcodeScanningResult) => {
      const codeScanned: string = result.data;

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
        inputAmountPopupRef.current?.present();
        setSuccessForBarcodeScan(result?.data);
      }
    },
    [currentQr]
  );

  return (
    <>
      <View className="flex-1 bg-gray-50 pt-2">
        {!isScanQrCodeProduct && shouldDisplayQrScan && (
          <ScanOnView onSuccessBarcodeScanned={handleSuccessBarCode} />
        )}
        <OrderPickProducts />
      </View>
      <ActionBottom />
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
