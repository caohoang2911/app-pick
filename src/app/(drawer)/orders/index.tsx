import Container from '@/components/Container';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { setKeyWord, toggleScanQrCode, useOrders } from '@/core/store/orders';
import { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import ButtonBack from '~/src/components/ButtonBack';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import ScannerBox from '~/src/components/shared/ScannerBox';
import { useConfig } from '~/src/core/store/config';

const Orders = () => {
  const navigation = useNavigation();
  const isScanQrCode = useOrders.use.isScanQrCode();

  const config = useConfig.use.config();

  console.log(config?.orderTags, "my-config");

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
        }}
        onDestroy={() => {
          toggleScanQrCode(false);
        }}
      />
    </>
  );
};

export default Orders;
