import Container from '@/components/Container';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { setDeliveryType, setFromScanQrCode, setKeyWord, setOperationType, setSelectedOrderCounter, toggleScanQrCode, useOrders } from '@/core/store/orders';
import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { checkNotificationPermission } from '~/src/core/utils/notificationPermission';

const Orders = () => {
  const navigation = useNavigation();
  const isScanQrCode = useOrders.use.isScanQrCode();
  
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Header />,
    });
  }, []);

  useRefreshOnFocus(async () => {});

  const handleSuccessBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    setKeyWord(result?.data || '');
    setFromScanQrCode(true);
    setDeliveryType('');
    setOperationType('');
    setSelectedOrderCounter('ALL');
  }, []);

  const handleDestroy = useCallback(() => {
    toggleScanQrCode(false);
  }, []);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  return (
    <>
      <Container>
        <OrderList />
      </Container>
      <ScannerBox
        type="qr"
        visible={isScanQrCode}
        onSuccessBarcodeScanned={handleSuccessBarcodeScanned}
        onDestroy={handleDestroy}
      />
    </>
  );
};

export default Orders;
