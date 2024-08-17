import Container from '@/components/Container';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { toggleScanQrCode, useOrders } from '@/core/store/orders';
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
        onSuccessBarcodeScanned={(result) => {
          alert(JSON.stringify(result));
        }}
        onDestroy={() => {
          toggleScanQrCode(false);
        }}
      />
    </>
  );
};

export default Orders;
