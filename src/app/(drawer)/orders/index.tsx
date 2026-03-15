import Container from '@/components/Container';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import {
  setDeliveryType,
  setFromScanQrCode,
  setKeyWord,
  setSelectedOrderCounter,
  toggleScanQrCode,
  useOrders,
} from '@/core/store/orders';

import { BarcodeScanningResult } from '~/src/types/scanner';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { checkNotificationPermission } from '~/src/core/utils/notificationPermission';
import { useAuth } from '~/src/core';
import { useCodepush } from '@/core/hooks/useCodePush';

const Orders = () => {
  const navigation = useNavigation();
  const isScanQrCode = useOrders.use.isScanQrCode();
  const userInfo = useAuth.use.userInfo();
  const prevStoreCodeRef = useRef<string | undefined>(userInfo?.storeCode);
  const { isDoneCodepush } = useCodepush();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Header />,
    });
  }, []);

  useRefreshOnFocus(async () => {});

  // Đóng ScannerBox khi storeCode thay đổi (chuyển kho)
  useEffect(() => {
    const currentStoreCode = userInfo?.storeCode;
    const prevStoreCode = prevStoreCodeRef.current;

    // Nếu storeCode thay đổi và ScannerBox đang mở, đóng nó
    if (
      prevStoreCode !== undefined &&
      currentStoreCode !== prevStoreCode &&
      isScanQrCode
    ) {
      toggleScanQrCode(false);
    }

    // Cập nhật ref với storeCode hiện tại
    prevStoreCodeRef.current = currentStoreCode;
  }, [userInfo?.storeCode, isScanQrCode]);

  const handleSuccessBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      setKeyWord(result?.data || '');
      setFromScanQrCode(true);
      setDeliveryType('');
      setSelectedOrderCounter('ALL');
    },
    [],
  );

  const handleDestroy = useCallback(() => {
    toggleScanQrCode(false);
  }, []);

  // Only check notification permission after code push is complete
  useEffect(() => {
    if (isDoneCodepush) {
      checkNotificationPermission(undefined, isDoneCodepush);
    }
  }, [isDoneCodepush]);

  return (
    <>
      <Container>
        <OrderList />
      </Container>
      <ScannerBox
        visible={isScanQrCode}
        onSuccessBarcodeScanned={handleSuccessBarcodeScanned}
        onDestroy={handleDestroy}
      />
    </>
  );
};

export default Orders;
