import Container from '@/components/Container';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { reset, setDeliveryType, setFromScanQrCode, setKeyWord, setOperationType, setSelectedOrderCounter, toggleScanQrCode, useOrders } from '@/core/store/orders';
import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import ScannerBox from '~/src/components/shared/ScannerBox';

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

  return (
    <>
      <Container>
        <OrderList />
      </Container>
      <ScannerBox
        type="qr"
        visible={isScanQrCode}
        onSuccessBarcodeScanned={(result: BarcodeScanningResult) => {
          setKeyWord(result?.data || '');
          setFromScanQrCode(true);
          setDeliveryType('');
          setOperationType('');
          setSelectedOrderCounter('ALL');
        }}
        onDestroy={() => {
          toggleScanQrCode(false);
        }}
      />
    </>
  );
};

export default Orders;
