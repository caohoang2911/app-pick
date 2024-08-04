import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScannerBox from '~/src/components/shared/ScannerBox';
import FixedHeader from '~/src/components/orders/fixed-header';
import OrderList from '~/src/components/orders/order-list';
import Container from '../components/Container';

const Orders = () => {
  const [isScanner, setIsscanner] = useState(false);

  return (
    <>
      <Container>
        <FixedHeader
          onOpenBarcodeScanner={() => {
            setIsscanner(true);
          }}
        />
        <OrderList />
      </Container>
      <ScannerBox
        type="qr"
        visible={isScanner}
        onSuccessBarcodeScanned={(result) => {
          alert(JSON.stringify(result));
        }}
        onDestroy={() => {
          setIsscanner(false);
        }}
      />
    </>
  );
};

export default Orders;
