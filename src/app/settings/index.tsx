import { getItem, setItem } from '@/core/storage';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { useTestSendNoti } from '~/src/api/app-pick/use-test-send-noti';
import { Button } from '~/src/components/Button';
import { type DeviceConnectionStatus } from '~/src/components/settings/device-status-badge';
import PrinterDeviceCard from '~/src/components/settings/printer-device-card';
import SettingsCard from '~/src/components/settings/settings-card';
import TelegramCard from '~/src/components/settings/telegram-card';
import TelegramIdGuideModal from '~/src/components/settings/telegram-id-guide-modal';
import { Switch } from '~/src/components/Switch';
import { signOut, useAuth } from '~/src/core';
import { TELEGRAM_USER_INFO_BOT_LINK } from '~/src/core/constants/telegram';
import { useConfig } from '~/src/core/store/config';
import {
  fetchLatestAndroidApkUrl,
  getAndroidApkReleasesPageUrl,
} from '~/src/core/utils/android-apk-update';
import { checkNotificationPermission } from '~/src/core/utils/notification-permission';
import {
  checkTcpConnection,
  PRINTER_PORT,
  showPrinterConnectionFailMessage,
} from '~/src/core/utils/printer-connection';

/** Tạm ẩn cài đặt đăng ký thông báo theo loại đơn — bật lại khi cần */
const SHOW_NOTIFICATION_SUBSCRIPTION_SETTINGS = false;

type DeviceKey = 'bill' | 'label';

const DEVICE_KEYS: DeviceKey[] = ['bill', 'label'];

const DEVICE_META: Record<
  DeviceKey,
  {
    title: string;
    tint: 'blue' | 'orange';
    placeholder: string;
    storageKey: string;
    saveSuccessMessage: string;
    saveFailMessage: string;
  }
> = {
  bill: {
    title: 'Máy in hoá đơn',
    tint: 'blue',
    placeholder: 'Nhập IP máy tạo hoá đơn',
    storageKey: 'ipPrinterBill',
    saveSuccessMessage: 'Lưu IP máy tạo hoá đơn thành công',
    saveFailMessage:
      'Không thể kết nối máy in, lưu IP máy tạo hoá đơn thất bại',
  },
  label: {
    title: 'Máy in label',
    tint: 'orange',
    placeholder: 'Nhập IP máy in label',
    storageKey: 'ipPrinterLabel',
    saveSuccessMessage: 'Lưu IP máy in label thành công',
    saveFailMessage: 'Không thể kết nối máy in, lưu IP máy in label thất bại',
  },
};

const SectionLabel = ({
  title,
  trailing,
}: {
  title: string;
  trailing?: string;
}) => (
  <View className="mx-4 mt-1 flex-row items-end justify-between">
    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
      {title}
    </Text>
    {!!trailing && (
      <Text
        numberOfLines={1}
        className="ml-3 flex-1 text-right text-xs text-gray-500"
      >
        {trailing}
      </Text>
    )}
  </View>
);

const Settings = () => {
  const { data } = useGetSettingQuery();
  const noti = data?.data?.noti || ({} as any);
  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const scrollViewRef = useRef<ScrollView>(null);
  const billInputRef = useRef<any>(null);
  const labelInputRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const activeInputRef = useRef<DeviceKey | null>(null);

  const user = useAuth.use.userInfo();
  const { storeCode, teleId } = user || {};

  const store: any = stores.find((store: any) => store.id === storeCode);
  const {
    billPrinterIp: storeBillPrinterIp,
    labelPrinterIp: storeLabelPrinterIp,
    name,
  } = store || {};

  const [ips, setIps] = useState<Record<DeviceKey, string>>(() => ({
    bill: getItem('ipPrinterBill') || storeBillPrinterIp || '',
    label: getItem('ipPrinterLabel') || storeLabelPrinterIp || '',
  }));
  // Trạng thái kết nối từng thiết bị — mở màn hình là 'checking' ngay để
  // hiện loading indicator trong lúc chờ kết quả check đầu tiên.
  const [statuses, setStatuses] = useState<
    Record<DeviceKey, DeviceConnectionStatus>
  >({ bill: 'checking', label: 'checking' });
  const [saving, setSaving] = useState<Record<DeviceKey, boolean>>({
    bill: false,
    label: false,
  });
  const [testing, setTesting] = useState<Record<DeviceKey, boolean>>({
    bill: false,
    label: false,
  });
  // Đánh số từng lượt check để kết quả cũ (về trễ) không đè kết quả mới.
  const statusSeq = useRef<Record<DeviceKey, number>>({ bill: 0, label: 0 });
  const ipsRef = useRef(ips);
  ipsRef.current = ips;

  const { mutate: testSendNoti, isPending: isPendingTestSendNoti } =
    useTestSendNoti();

  const [isOpeningApkLink, setIsOpeningApkLink] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

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
            const inputRef =
              activeInputRef.current === 'bill'
                ? billInputRef.current
                : activeInputRef.current === 'label'
                  ? labelInputRef.current
                  : null;
            if (inputRef && scrollViewRef.current) {
              inputRef.measureLayout(
                scrollViewRef.current.getInnerViewNode?.() ||
                  scrollViewRef.current,
                (_x: number, y: number) => {
                  scrollViewRef.current?.scrollTo({
                    y: Math.max(0, y - 100),
                    animated: true,
                  });
                },
                () => {
                  // Fallback: scroll to end
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                },
              );
            }
          },
          Platform.OS === 'ios' ? 100 : 200,
        );
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        activeInputRef.current = null;
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  /**
   * Check kết nối tới IP:PORT của thiết bị và cập nhật pill trạng thái.
   * Trả về kết quả để các luồng test/lưu dùng tiếp.
   */
  const runStatusCheck = useCallback(
    async (device: DeviceKey, ip: string): Promise<boolean> => {
      const seq = ++statusSeq.current[device];
      const applyStatus = (status: DeviceConnectionStatus) => {
        if (statusSeq.current[device] === seq) {
          setStatuses((prev) => ({ ...prev, [device]: status }));
        }
      };

      if (!ip) {
        applyStatus('unknown');
        return false;
      }

      applyStatus('checking');
      const ok = await checkTcpConnection(ip);
      applyStatus(ok ? 'online' : 'offline');
      return ok;
    },
    [],
  );

  // Mỗi lần mở (focus) màn hình: check kết nối cả 2 thiết bị song song.
  useFocusEffect(
    useCallback(() => {
      DEVICE_KEYS.forEach((device) => {
        runStatusCheck(device, ipsRef.current[device]);
      });
    }, [runStatusCheck]),
  );

  const handleChangeIp = (device: DeviceKey, value: string) => {
    setIps((prev) => ({ ...prev, [device]: value }));
  };

  const handleTestDevice = async (device: DeviceKey) => {
    Keyboard.dismiss();
    const ip = ipsRef.current[device];
    if (!ip) return;
    setTesting((prev) => ({ ...prev, [device]: true }));
    const ok = await runStatusCheck(device, ip);
    setTesting((prev) => ({ ...prev, [device]: false }));
    if (ok) {
      showMessage({
        message: `Kết nối thành công tới ${ip}:${PRINTER_PORT}`,
        type: 'success',
      });
    } else {
      void showPrinterConnectionFailMessage(
        `Không thể kết nối tới ${ip}:${PRINTER_PORT}`,
      );
    }
  };

  // Giữ hành vi cũ: chỉ lưu IP khi kết nối được tới máy in.
  const handleSaveDevice = async (device: DeviceKey) => {
    Keyboard.dismiss();
    const meta = DEVICE_META[device];
    const ip = ipsRef.current[device];
    if (!ip) return;
    setSaving((prev) => ({ ...prev, [device]: true }));
    const ok = await runStatusCheck(device, ip);
    setSaving((prev) => ({ ...prev, [device]: false }));
    if (ok) {
      setItem(meta.storageKey, ip);
      showMessage({ message: meta.saveSuccessMessage, type: 'success' });
    } else {
      void showPrinterConnectionFailMessage(meta.saveFailMessage);
    }
  };

  // Behavior cũ: reset về IP mặc định của siêu thị và lưu ngay (không cần
  // kết nối được), sau đó check lại trạng thái với IP vừa reset.
  const handleResetDevice = (device: DeviceKey) => {
    Keyboard.dismiss();
    const meta = DEVICE_META[device];
    const fallbackIp =
      (device === 'bill' ? storeBillPrinterIp : storeLabelPrinterIp) || '';
    // Siêu thị chưa cấu hình IP mặc định → báo và giữ nguyên IP đang nhập.
    if (!fallbackIp) {
      showMessage({
        message: `Siêu thị chưa có IP mặc định cho ${meta.title.toLowerCase()}`,
        type: 'warning',
      });
      return;
    }
    setItem(meta.storageKey, fallbackIp);
    setIps((prev) => ({ ...prev, [device]: fallbackIp }));
    runStatusCheck(device, fallbackIp);
    showMessage({
      message: `Đã đặt lại IP ${meta.title.toLowerCase()} về mặc định: ${fallbackIp}`,
      type: 'success',
    });
  };

  const handleOpenTelegram = async () => {
    try {
      await Linking.openURL(TELEGRAM_USER_INFO_BOT_LINK);
    } catch {
      showMessage({
        message: 'Không mở được Telegram. Thử lại sau.',
        type: 'danger',
      });
    }
  };

  const handleTestPushNotification = async () => {
    const hasPermission = await checkNotificationPermission(undefined, true);

    if (!hasPermission) {
      // Permission denied, notification cannot be sent
      return false;
    }
    testSendNoti();
  };

  const handleOpenApkLink = async () => {
    if (isOpeningApkLink) return;
    setIsOpeningApkLink(true);
    try {
      const apkUrl = await fetchLatestAndroidApkUrl();
      const url = apkUrl || getAndroidApkReleasesPageUrl();
      // Logout sync trước khi rời app (browser/installer).
      signOut();
      await Linking.openURL(url);
    } catch {
      showMessage({
        message: 'Không mở được link APK. Thử lại sau.',
        type: 'danger',
      });
    } finally {
      setIsOpeningApkLink(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-gray-200 flex-1"
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
          <TelegramCard
            badgeText={teleId != null ? String(teleId) : undefined}
            onOpen={handleOpenTelegram}
            onOpenGuide={() => setShowTelegramGuide(true)}
          />

          <SectionLabel title="Thiết bị" trailing={name} />

          {DEVICE_KEYS.map((device) => {
            const meta = DEVICE_META[device];
            return (
              <PrinterDeviceCard
                key={device}
                title={meta.title}
                tint={meta.tint}
                placeholder={meta.placeholder}
                ip={ips[device]}
                status={statuses[device]}
                busy={testing[device] || saving[device]}
                saving={saving[device]}
                onChangeIp={(value) => handleChangeIp(device, value)}
                onTest={() => handleTestDevice(device)}
                onSave={() => handleSaveDevice(device)}
                onReset={() => handleResetDevice(device)}
                onFocusInput={() => {
                  activeInputRef.current = device;
                }}
                inputWrapperRef={
                  device === 'bill' ? billInputRef : labelInputRef
                }
              />
            );
          })}

          <SectionLabel title="Khác" />

          <SettingsCard>
            <Text className="text-base font-bold">Thông báo</Text>
            <View className="flex flex-col gap-4 mt-3">
              {SHOW_NOTIFICATION_SUBSCRIPTION_SETTINGS && (
                <>
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
                </>
              )}
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
          </SettingsCard>

          {Platform.OS === 'android' && (
            <SettingsCard>
              <Text className="text-base font-bold">Cập nhật ứng dụng</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Build hiện tại: {Application.nativeBuildVersion ?? '—'}
              </Text>
              <Text className="text-sm text-gray-600 mt-2">
                Nếu bỏ lỡ thông báo cập nhật, mở link APK mới nhất tại đây.
              </Text>
              <View className="mt-3">
                <Button
                  label="Link APK"
                  loading={isOpeningApkLink}
                  onPress={handleOpenApkLink}
                />
              </View>
            </SettingsCard>
          )}
        </View>
      </ScrollView>

      <TelegramIdGuideModal
        visible={showTelegramGuide}
        onClose={() => setShowTelegramGuide(false)}
        onOpenTelegram={handleOpenTelegram}
      />
    </KeyboardAvoidingView>
  );
};

export default Settings;
