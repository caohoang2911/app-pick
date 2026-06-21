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
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Header from '~/src/components/orders/header';
import OrderList from '~/src/components/orders/order-list';
import ScannerBox from '~/src/components/shared/scanner-box';
import { checkNotificationPermission } from '~/src/core/utils/notification-permission';
import { useAuth } from '~/src/core';
import { useCodepush } from '@/core/hooks/useCodePush';
import { Text, View } from 'react-native';

const Orders = () => {
  const navigation = useNavigation();
  const isScanQrCode = useOrders.use.isScanQrCode();
  const userInfo = useAuth.use.userInfo();
  const prevStoreCodeRef = useRef<string | undefined>(userInfo?.storeCode);
  const { isDoneCodepush } = useCodepush();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Header />,
      gestureEnabled: false,
      fullScreenGestureEnabled: false,
    });
  }, [navigation]);

  // Chặn swipe back từ navigator cha (Drawer / Root) khi đang ở danh sách đơn
  useFocusEffect(
    useCallback(() => {
      let parent = navigation.getParent();
      while (parent) {
        parent.setOptions({ gestureEnabled: false });
        parent = parent.getParent();
      }
    }, [navigation]),
  );

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

  // Sau CodePush (một nguồn từ useCodepushStore + mutex trong checkNotificationPermission)
  useEffect(() => {
    if (!isDoneCodepush) return;
    void checkNotificationPermission(undefined, true);
  }, [isDoneCodepush]);

  return (
    <View className="flex-1">
      <Container>
        <OrderList />
      </Container>
      <ScannerBox
        visible={isScanQrCode}
        onSuccessBarcodeScanned={handleSuccessBarcodeScanned}
        onDestroy={handleDestroy}
      />
    </View>
  );
};

export default Orders;
