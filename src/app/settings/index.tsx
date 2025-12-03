import { getItem, setItem } from '@/core/storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';
import { useTestSendNoti } from '~/src/api/app-pick/test-send-noti';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { Button } from '~/src/components/Button';
import { Input } from '~/src/components/Input';
import { Switch } from '~/src/components/Switch';
import { useAuth } from '~/src/core';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { useConfig } from '~/src/core/store/config';
import { checkNotificationPermission } from '~/src/core/utils/notificationPermission';

const Settings = () => {
  const { data } = useGetSettingQuery();
  const noti = data?.data?.noti || ({} as any);
  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const labelPrinterTimer = useRef<any>(null);
  const billPrinterTimer = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const billInputRef = useRef<any>(null);
  const labelInputRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isKeyboardVisible = useKeyboardVisible();
  const activeInputRef = useRef<'label' | 'bill' | null>(null);

  const user = useAuth.use.userInfo();
  const { storeCode } = user || {};

  const store: any = stores.find((store: any) => store.id === storeCode);
  const {
    billPrinterIp: storeBillPrinterIp,
    labelPrinterIp: storeLabelPrinterIp,
    name,
  } = store || {};

  const [labelPrinterIp, setLabelPrinterIp] = useState<string>(
    getItem('ipPrinterLabel') || storeLabelPrinterIp || ''
  );
  const [billPrinterIp, setBillPrinterIp] = useState<string>(
    getItem('ipPrinterBill') || storeBillPrinterIp || ''
  );
  const [isLoadingLabelPrinter, setIsLoadingLabelPrinter] =
    useState<boolean>(false);
  const [isLoadingBillPrinter, setIsLoadingBillPrinter] =
    useState<boolean>(false);

  const { mutate: testSendNoti, isPending: isPendingTestSendNoti } =
    useTestSendNoti();

  const [isSubcribeOrderStoreDelivery, setIsSubcribeOrderStoreDelivery] =
    useState<any>(false);
  const [isSubcribeOrderCustomerPickup, setIsSubcribeOrderCustomerPickup] =
    useState<any>(false);
  const [isSubcribeOrderShipperDelivery, setIsSubcribeOrderShipperDelivery] =
    useState<any>(false);

  useEffect(() => {
    setIsSubcribeOrderStoreDelivery(noti?.isSubcribeOrderStoreDelivery);
    setIsSubcribeOrderCustomerPickup(noti?.isSubcribeOrderCustomerPickup);
    setIsSubcribeOrderShipperDelivery(noti?.isSubcribeOrderShipperDelivery);
  }, [noti]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to active input when keyboard shows
        setTimeout(
          () => {
            if (
              activeInputRef.current === 'bill' &&
              billInputRef.current &&
              scrollViewRef.current
            ) {
              billInputRef.current.measureLayout(
                scrollViewRef.current.getInnerViewNode?.() ||
                  scrollViewRef.current,
                (x: number, y: number) => {
                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, y - 100),
                    animated: true,
                  });
                },
                () => {
                  // Fallback: scroll to end
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }
              );
            } else if (
              activeInputRef.current === 'label' &&
              labelInputRef.current &&
              scrollViewRef.current
            ) {
              labelInputRef.current.measureLayout(
                scrollViewRef.current.getInnerViewNode?.() ||
                  scrollViewRef.current,
                (x: number, y: number) => {
                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, y - 100),
                    animated: true,
                  });
                },
                () => {}
              );
            }
          },
          Platform.OS === 'ios' ? 100 : 200
        );
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        activeInputRef.current = null;
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleResetLabelPrinter = () => {
    Keyboard.dismiss();
    setItem('ipPrinterLabel', storeLabelPrinterIp);
    setLabelPrinterIp(storeLabelPrinterIp);
  };

  const handleResetBillPrinter = () => {
    Keyboard.dismiss();
    setItem('ipPrinterBill', storeBillPrinterIp);
    setBillPrinterIp(storeBillPrinterIp);
  };

  const handleSaveLabelPrinter = () => {
    setIsLoadingLabelPrinter(true);
    Keyboard.dismiss();
    try {
      const client = TcpSocket.createConnection(
        {
          port: 9100,
          host: labelPrinterIp,
          reuseAddress: true,
        },
        () => {
          console.log('Connected to label printer');
          setItem('ipPrinterLabel', labelPrinterIp);
          showMessage({
            message: 'Lưu IP máy in label thành công',
            type: 'success',
          });
          if (labelPrinterTimer.current) {
            clearTimeout(labelPrinterTimer.current);
          }
          client.destroy();
          setIsLoadingLabelPrinter(false);
        }
      );

      labelPrinterTimer.current = setTimeout(() => {
        showMessage({
          message: 'Lưu IP máy in label thất bại',
          type: 'danger',
        });
        client.destroy();
        setIsLoadingLabelPrinter(false);
      }, 5000);
    } catch (error) {
      setIsLoadingLabelPrinter(false);
      showMessage({
        message: 'Lỗi không xác định khi kết nối máy in label',
        type: 'danger',
      });
    }
  };

  const handleSaveBillPrinter = () => {
    setIsLoadingBillPrinter(true);
    Keyboard.dismiss();
    try {
      const client = TcpSocket.createConnection(
        {
          port: 9100,
          host: billPrinterIp,
          reuseAddress: true,
        },
        () => {
          console.log('Connected to bill printer');
          setItem('ipPrinterBill', billPrinterIp);
          showMessage({
            message: 'Lưu IP máy in hoá đơn thành công',
            type: 'success',
          });
          if (billPrinterTimer.current) {
            clearTimeout(billPrinterTimer.current);
          }
          client.destroy();
          setIsLoadingBillPrinter(false);
        }
      );

      billPrinterTimer.current = setTimeout(() => {
        showMessage({
          message: 'Lưu IP máy in hoá đơn thất bại',
          type: 'danger',
        });
        client.destroy();
        setIsLoadingBillPrinter(false);
      }, 5000);
    } catch (error) {
      setIsLoadingBillPrinter(false);
      showMessage({
        message: 'Lỗi không xác định khi kết nối máy in hoá đơn',
        type: 'danger',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (labelPrinterTimer.current) {
        clearTimeout(labelPrinterTimer.current);
      }
      if (billPrinterTimer.current) {
        clearTimeout(billPrinterTimer.current);
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
    <KeyboardAvoidingView
      className="bg-gray-100 flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          paddingBottom:
            keyboardHeight > 0 ? Math.min(keyboardHeight * 0.3, 90) : 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View className="flex-grow flex mt-4 gap-3 pb-4">
          <View className="bg-white p-3 mx-4 rounded-lg" style={styles.box}>
            <Text className="text-base font-bold">Thông báo</Text>
            <View className="flex flex-col gap-4 mt-3">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base">Đơn Shipper giao hàng</Text>
                <Switch
                  disabled
                  value={isSubcribeOrderShipperDelivery as boolean}
                  onValueChange={setIsSubcribeOrderShipperDelivery}
                />
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base">Đơn Store giao hàng</Text>
                <Switch
                  disabled
                  value={isSubcribeOrderStoreDelivery as boolean}
                  onValueChange={setIsSubcribeOrderStoreDelivery}
                />
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base">Đơn khách hàng pickup</Text>
                <Switch
                  disabled
                  value={isSubcribeOrderCustomerPickup as boolean}
                  onValueChange={setIsSubcribeOrderCustomerPickup}
                />
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base text-orange-500">
                  Test gửi thông báo
                </Text>
                <Button
                  variant="warning"
                  loading={isPendingTestSendNoti}
                  label="Gửi"
                  onPress={handleTestPushNotification}
                />
              </View>
            </View>
          </View>
          <View className="bg-white p-3 mx-4 rounded-lg" style={styles.box}>
            <Text numberOfLines={1} className="text-base font-bold">
              Máy in - {name}
            </Text>
            <View className="mt-4 border-t border-gray-200 pt-3">
              <Text className="text-sm font-semibold mb-2">Máy in hoá đơn</Text>
              <View className="flex flex-row items-center gap-2 mb-3">
                <View ref={billInputRef} collapsable={false} className="flex-1">
                  <Input
                    value={billPrinterIp}
                    className="flex-1"
                    placeholder="Nhập IP máy in hoá đơn"
                    onChangeText={setBillPrinterIp}
                    onFocus={() => {
                      activeInputRef.current = 'bill';
                    }}
                  />
                </View>
                <Button
                  loading={isLoadingBillPrinter}
                  disabled={!billPrinterIp}
                  label="Lưu"
                  onPress={handleSaveBillPrinter}
                />
                <Button
                  variant="warning"
                  label="Reset"
                  onPress={handleResetBillPrinter}
                />
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-sm font-semibold mb-2">Máy in label</Text>
              <View className="flex flex-row items-center gap-2 mb-3">
                <View
                  ref={labelInputRef}
                  collapsable={false}
                  className="flex-1"
                >
                  <Input
                    value={labelPrinterIp}
                    className="flex-1"
                    placeholder="Nhập IP máy in label"
                    onChangeText={setLabelPrinterIp}
                    onFocus={() => {
                      activeInputRef.current = 'label';
                    }}
                  />
                </View>
                <Button
                  loading={isLoadingLabelPrinter}
                  disabled={!labelPrinterIp}
                  label="Lưu"
                  onPress={handleSaveLabelPrinter}
                />
                <Button
                  variant="warning"
                  label="Reset"
                  onPress={handleResetLabelPrinter}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
