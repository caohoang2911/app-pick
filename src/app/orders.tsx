import React, { useEffect, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import ScannerBox from '~/src/components/shared/ScannerBox';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import { useNavigation } from 'expo-router';
import Container from '@/components/Container';
import { toggleScanQrCode, useOrders } from '@/core/store/orders';
import { usePushNotifications } from '~/src/core/hooks/usePushNotifications';

const Orders = () => {
  const navigation = useNavigation();

  const isScanQrCode = useOrders.use.isScanQrCode();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitleContainerStyle: {
        width: Dimensions.get('window').width,
      },
      header: () => (
        <Header
          onOpenBarcodeScanner={() => {
            toggleScanQrCode(true);
          }}
        />
      ),
    });
  }, []);

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
