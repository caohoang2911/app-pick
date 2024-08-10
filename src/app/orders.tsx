import React, { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScannerBox from '~/src/components/shared/ScannerBox';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import { useNavigation } from 'expo-router';
import Container from '../components/Container';
import SBottomSheet from '../components/SBottomSheet';

const Orders = () => {
  const [isScanner, setIsscanner] = useState(false);
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitleContainerStyle: {
        width: Dimensions.get('window').width,
      },
      header: () => (
        <Header
          onOpenBarcodeScanner={() => {
            setIsscanner(true);
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
