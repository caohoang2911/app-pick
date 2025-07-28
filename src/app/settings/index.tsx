import { getItem, setItem } from '@/core/storage';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';
import { useTestSendNoti } from '~/src/api/app-pick/test-send-noti';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { Button } from '~/src/components/Button';
import { Input } from '~/src/components/Input';
import { Switch } from '~/src/components/Switch';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import { checkNotificationPermission } from '~/src/core/utils/notificationPermission';
import { checkPermissionAndSend, confirmAndSendNotification } from '~/src/core/utils/notificationSender';

const Settings = () => {
  const { data } = useGetSettingQuery();
  const noti = data?.data?.noti || {} as any;
  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const timer = useRef<any>(null);

  const user = useAuth.use.userInfo();
  const { storeCode } = user || {}

  const store: any = stores.find((store: any) => store.id === storeCode);
  const { printerIp, name } = store || {};

  const [ip, setIp] = useState<string>(getItem('ip') || printerIp || '');
  const [isLoadingPrint, setIsLoadingPrint] = useState<boolean>(false);
  


  const { mutate: testSendNoti, isPending: isPendingTestSendNoti } = useTestSendNoti();

  const [isSubcribeOrderStoreDelivery, setIsSubcribeOrderStoreDelivery] = useState<any>(false);
  const [isSubcribeOrderCustomerPickup, setIsSubcribeOrderCustomerPickup] = useState<any>(false);
  const [isSubcribeOrderShipperDelivery, setIsSubcribeOrderShipperDelivery] = useState<any>(false);

  useEffect(() => {
    setIsSubcribeOrderStoreDelivery(noti?.isSubcribeOrderStoreDelivery);
    setIsSubcribeOrderCustomerPickup(noti?.isSubcribeOrderCustomerPickup);
    setIsSubcribeOrderShipperDelivery(noti?.isSubcribeOrderShipperDelivery);
  }, [noti]);

  const handleResetIp = () => {
    setItem('ip', printerIp);
    setIp(printerIp);
  };

  const handleSaveIp = () => {
    setIsLoadingPrint(true);
    try {
      const client = TcpSocket.createConnection({
        port: 9100,
        host: ip,
        reuseAddress: true,
    }, () => {
      console.log('Connected to server');
      setItem('ip', ip);
      showMessage({
        message: 'Kết nối máy in thành công',
        type: 'success',
      });
      if(timer.current) {
        clearTimeout(timer.current);
      }
      client.destroy();
      setIsLoadingPrint(false);
    });

    timer.current = setTimeout(() => {
      showMessage({
        message: 'Kết nối máy in thất bại',
        type: 'danger',
      });
      client.destroy();
      setIsLoadingPrint(false);
    }, 5000);

    } catch (error) {
      setIsLoadingPrint(false);
      showMessage({
        message: "Lỗi không xác định khi kết nối máy in",
        type: 'danger',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const handleTestPushNotification = async () => {
    const hasPermission = await checkNotificationPermission();
  
    if (!hasPermission) {
      // Permission denied, notification cannot be sent
      return false;
    }
    testSendNoti();

  };

  return (
    <View className="bg-gray-100 flex-1">
      <View className="flex-grow flex mt-4 gap-3">
        <View className='bg-white p-3 mx-4 rounded-lg' style={styles.box}>
          <Text className="text-base font-bold">Thông báo</Text>
          <View className="flex flex-col gap-4 mt-3">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn Shipper giao hàng</Text>
              <Switch disabled value={isSubcribeOrderShipperDelivery as boolean} onValueChange={setIsSubcribeOrderShipperDelivery} />
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn Store giao hàng</Text>
              <Switch disabled value={isSubcribeOrderStoreDelivery as boolean} onValueChange={setIsSubcribeOrderStoreDelivery} />
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn khách hàng pickup</Text>
              <Switch disabled value={isSubcribeOrderCustomerPickup as boolean} onValueChange={setIsSubcribeOrderCustomerPickup} />
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base text-orange-500">Test gửi thông báo</Text>
              <Button variant="warning" loading={isPendingTestSendNoti} label="Gửi" onPress={handleTestPushNotification} />
            </View>
          </View>
        </View>
        <View className='bg-white p-3 mx-4 rounded-lg' style={styles.box}>
          <Text numberOfLines={1} className="text-base font-bold">Máy in - {name}</Text>
          <View className="flex flex-row gap-2 my-3">
            <Input value={ip} className="flex-1" placeholder="Nhập IP máy in" onChangeText={setIp} />
          </View>
          <View className="flex flex-row justify-end gap-2">
            <Button loading={isLoadingPrint} label="Lưu" onPress={handleSaveIp} />
            <Button variant="warning" label="Reset" onPress={handleResetIp} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 2,
      },
    }),
  },
});

export default Settings;