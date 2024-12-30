import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { useUpdateSetting } from '~/src/api/app-pick/use-update-setting';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import { Input } from '~/src/components/Input';
import { Switch } from '~/src/components/Switch';
import { setLoading } from '~/src/core/store/loading';
import TcpSocket from 'react-native-tcp-socket';
import { showMessage } from 'react-native-flash-message';
import { getItem, setItem } from '@/core/storage';

const Settings = () => {
  const { data } = useGetSettingQuery();
  const noti = data?.data?.noti || {} as any;

  const [ip, setIp] = useState<string>(getItem('ip') || '');
  const [isLoadingPrint, setIsLoadingPrint] = useState<boolean>(false);
  
  const { mutate: updateSetting, isPending } = useUpdateSetting(() => {
    queryClient.invalidateQueries({ queryKey: ['getSetting'] });
  });

  const [isSubcribeOrderStoreDelivery, setIsSubcribeOrderStoreDelivery] = useState<any>(false);
  const [isSubcribeOrderCustomerPickup, setIsSubcribeOrderCustomerPickup] = useState<any>(false);
  const [isSubcribeOrderShipperDelivery, setIsSubcribeOrderShipperDelivery] = useState<any>(false);

  useEffect(() => {
    setIsSubcribeOrderStoreDelivery(noti?.isSubcribeOrderStoreDelivery);
    setIsSubcribeOrderCustomerPickup(noti?.isSubcribeOrderCustomerPickup);
    setIsSubcribeOrderShipperDelivery(noti?.isSubcribeOrderShipperDelivery);
  }, [noti]);

  const handleUpdateSetting = () => {
    setLoading(true);
    updateSetting({ data: { noti: { isSubcribeOrderStoreDelivery, isSubcribeOrderCustomerPickup, isSubcribeOrderShipperDelivery } } });
  };

  const handleSaveIp = () => {
    setIsLoadingPrint(true);
    const client = TcpSocket.createConnection({
      port: 9100,
      host: ip,
    }, () => {
      console.log('Connected to server');
      setItem('ip', ip);
      showMessage({
        message: 'Kết nối máy in thành công',
        type: 'success',
      });
      client.destroy();
      setIsLoadingPrint(false);
    });

    client.setTimeout(4000, () => {
      showMessage({
        message: 'Kết nối máy in thất bại',
        type: 'danger',
      });
      client.destroy();
      setIsLoadingPrint(false);
    });
  };

  return (
    <View className="bg-gray-100 flex-1">
      <View className="flex-grow flex mt-4 gap-3">
        <View className='bg-white p-3 mx-4 rounded-lg' style={styles.box}>
          <Text className="text-base font-bold">Thông báo</Text>
          <View className="flex flex-col gap-4 mt-3">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn Shipper giao hàng</Text>
              <Switch value={isSubcribeOrderShipperDelivery as boolean} onValueChange={setIsSubcribeOrderShipperDelivery} />
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn Store giao hàng</Text>
              <Switch value={isSubcribeOrderStoreDelivery as boolean} onValueChange={setIsSubcribeOrderStoreDelivery} />
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base">Đơn khách hàng pickup</Text>
              <Switch value={isSubcribeOrderCustomerPickup as boolean} onValueChange={setIsSubcribeOrderCustomerPickup} />
            </View>
          </View>
        </View>
        <View className='bg-white p-3 mx-4 rounded-lg' style={styles.box}>
          <Text className="text-base font-bold">Máy in</Text>
          <View className="flex flex-row gap-4 mt-3 justify-between">
            <Input value={ip} className="flex-1" placeholder="Nhập IP máy in" onChangeText={setIp} />
            <Button loading={isLoadingPrint} label="Lưu" onPress={handleSaveIp} />
          </View>
        </View>
      </View>
      <View className="px-4" style={{ paddingBottom: 30 }}>
        <Button label="Cập nhật" loading={isPending} onPress={handleUpdateSetting} />
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