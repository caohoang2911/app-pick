/**
 * Registry quyền ứng dụng — nguồn sự thật duy nhất cho màn "Quyền ứng dụng".
 *
 * Nguyên tắc: KHÔNG thêm native dependency mới (app là dev-client bare-workflow,
 * thêm module native = phải prebuild + build lại). Toàn bộ check/request tái dùng
 * các thư viện đã có:
 *   - react-native-vision-camera  → camera + micro (API tĩnh, đa nền tảng)
 *   - expo-notifications          → thông báo (đa nền tảng, cover APNs iOS)
 *   - PermissionsAndroid          → thư viện ảnh (Android)
 *   - react-native-callkeep       → "Tài khoản gọi" (Android telecom)
 */
import {
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { Camera } from 'react-native-vision-camera';
import * as Notifications from 'expo-notifications';

import type {
  AppPermissionDescriptor,
  DeclaredPermissionInfo,
  PermissionStatus,
} from '@/types/permissions';

// ─── Helpers mở Cài đặt ──────────────────────────────────────────────────────

/**
 * Mở trang cài đặt chi tiết của app (nơi có toggle Camera/Micro/Thông báo…).
 * - Android: `Linking.openSettings()` → mở thẳng "App info" của app.
 * - iOS: dùng URL công khai `app-settings:` (= UIApplicationOpenSettingsURLString,
 *   URL DUY NHẤT Apple cho phép). iOS 18.1+ mở thẳng trang app; iOS 18.0 có lỗi
 *   của Apple dừng ở danh sách "Settings › Apps" (bấm 1 lần vào app). KHÔNG có
 *   cách nào vào sâu hơn — scheme riêng `App-Prefs:` sẽ bị App Store từ chối.
 */
export const openAppSettings = (): void => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:').catch(() => {
      void Linking.openSettings();
    });
    return;
  }
  Linking.openSettings().catch((err) => {
    console.warn('[permissions] openAppSettings failed', err);
  });
};

/** Android: mở màn "Tài khoản gọi" để user bật account của CallKeep. */
const openPhoneAccountsSettings = (): void => {
  try {
    NativeModules.RNCallKeep?.openPhoneAccounts?.();
  } catch (err) {
    console.warn('[permissions] openPhoneAccounts failed', err);
    openAppSettings();
  }
};

// ─── Bộ chuyển đổi trạng thái về chuẩn chung ─────────────────────────────────

/** expo-notifications: status + canAskAgain → PermissionStatus. */
const mapExpoStatus = (
  status: string,
  canAskAgain: boolean,
): PermissionStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'undetermined';
  // status === 'denied'
  return canAskAgain ? 'denied' : 'blocked';
};

/** vision-camera: CameraPermissionStatus → PermissionStatus. */
const mapVisionCameraStatus = (
  status: 'granted' | 'not-determined' | 'denied' | 'restricted',
): PermissionStatus => {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'not-determined':
      return 'undetermined';
    case 'restricted':
      // iOS: bị hạn chế (parental controls) → chỉ bật lại trong Cài đặt.
      return 'blocked';
    case 'denied':
      // iOS: 'denied' = đã từ chối hẳn, chỉ bật lại trong Cài đặt → 'blocked'.
      // Android: getCameraPermissionStatus trả 'denied' cho CẢ "chưa từng hỏi"
      // lẫn "chặn vĩnh viễn" (không phân biệt được qua status). Coi là
      // 'undetermined' để vẫn bấm xin quyền được; nếu thực sự bị chặn thì
      // request() trả 'blocked' và màn hình tự sửa lại — tránh hiện "Bị chặn"
      // nhầm cho máy vừa cài chưa từng mở camera/micro.
      return Platform.OS === 'android' ? 'undetermined' : 'blocked';
    default:
      return 'undetermined';
  }
};

// ─── check/request cho từng cơ chế ───────────────────────────────────────────

const checkNotifications = async (): Promise<PermissionStatus> => {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return mapExpoStatus(status, canAskAgain);
};

const requestNotifications = async (): Promise<PermissionStatus> => {
  const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return mapExpoStatus(status, canAskAgain);
};

const checkCamera = async (): Promise<PermissionStatus> =>
  mapVisionCameraStatus(Camera.getCameraPermissionStatus());

const requestCamera = async (): Promise<PermissionStatus> => {
  const result = await Camera.requestCameraPermission();
  return result === 'granted' ? 'granted' : 'blocked';
};

const checkMicrophone = async (): Promise<PermissionStatus> =>
  mapVisionCameraStatus(Camera.getMicrophonePermissionStatus());

const requestMicrophone = async (): Promise<PermissionStatus> => {
  const result = await Camera.requestMicrophonePermission();
  return result === 'granted' ? 'granted' : 'blocked';
};

/** Android: quyền đọc ảnh đổi theo API level (13+ dùng READ_MEDIA_IMAGES). */
const getPhotoAndroidPermission = () =>
  Number(Platform.Version) >= 33
    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

const checkPhotoLibrary = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'unavailable';
  const granted = await PermissionsAndroid.check(getPhotoAndroidPermission());
  // PermissionsAndroid.check chỉ trả boolean → chưa cấp coi là 'undetermined'
  // (request sẽ phân biệt được denied vĩnh viễn).
  return granted ? 'granted' : 'undetermined';
};

const requestPhotoLibrary = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'unavailable';
  const result = await PermissionsAndroid.request(getPhotoAndroidPermission(), {
    title: 'Quyền truy cập thư viện',
    message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh bằng chứng.',
    buttonNeutral: 'Hỏi sau',
    buttonNegative: 'Huỷ',
    buttonPositive: 'Đồng ý',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
};

const checkPhoneAccount = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'unavailable';
  try {
    const enabled = await RNCallKeep.checkPhoneAccountEnabled();
    return enabled ? 'granted' : 'denied';
  } catch (err) {
    console.warn('[permissions] checkPhoneAccountEnabled failed', err);
    return 'unavailable';
  }
};

const requestPhoneAccount = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'unavailable';
  // Managed ConnectionService không bật account bằng code được → mở Cài đặt.
  openPhoneAccountsSettings();
  return checkPhoneAccount();
};

// ─── Danh sách quyền theo dõi được (có trạng thái + bật/tắt) ──────────────────

export const ALL_PERMISSIONS: AppPermissionDescriptor[] = [
  {
    id: 'notifications',
    title: 'Thông báo',
    description: 'Nhận thông báo đơn hàng mới và cuộc gọi đến từ tổng đài.',
    icon: 'notifications-outline',
    category: 'required',
    platforms: ['ios', 'android'],
    check: checkNotifications,
    request: requestNotifications,
  },
  {
    id: 'camera',
    title: 'Camera',
    description:
      'Quét mã vạch / QR của đơn, sản phẩm và chụp ảnh bằng chứng giao hàng.',
    icon: 'camera-outline',
    category: 'required',
    platforms: ['ios', 'android'],
    check: checkCamera,
    request: requestCamera,
  },
  {
    id: 'microphone',
    title: 'Micro',
    description:
      'Nghe và nói khi nhận cuộc gọi thoại từ tổng đài chăm sóc khách hàng.',
    icon: 'mic-outline',
    category: 'required',
    platforms: ['ios', 'android'],
    check: checkMicrophone,
    request: requestMicrophone,
  },
  {
    id: 'phoneAccount',
    title: 'Tài khoản gọi',
    description:
      'Cho phép hiển thị màn hình cuộc gọi đến khi app đang chạy nền hoặc đã tắt. Bật trong Cài đặt hệ thống.',
    icon: 'call-outline',
    category: 'required',
    platforms: ['android'],
    settingsOnly: true,
    check: checkPhoneAccount,
    request: requestPhoneAccount,
    openSettings: openPhoneAccountsSettings,
  },
  {
    id: 'photoLibrary',
    title: 'Thư viện ảnh',
    description: 'Chọn ảnh có sẵn trong máy làm bằng chứng giao hàng.',
    icon: 'images-outline',
    category: 'optional',
    platforms: ['android'],
    check: checkPhotoLibrary,
    request: requestPhotoLibrary,
  },
];

/** Lọc các quyền áp dụng cho nền tảng hiện tại. */
export const getApplicablePermissions = (): AppPermissionDescriptor[] => {
  const os = Platform.OS as 'ios' | 'android';
  return ALL_PERMISSIONS.filter((p) => p.platforms.includes(os));
};

export const getPermissionById = (
  id: AppPermissionDescriptor['id'],
): AppPermissionDescriptor | undefined =>
  ALL_PERMISSIONS.find((p) => p.id === id);

// ─── Bảng liệt kê TẤT CẢ quyền khai báo ở native (chỉ hiển thị / audit) ──────
// Nguồn: merged AndroidManifest.xml (đã gộp config-plugin CallKeep) + Info.plist
// + background modes do plugin withStringeeVoip chèn lúc prebuild.

export const DECLARED_PERMISSIONS_AUDIT: {
  android: DeclaredPermissionInfo[];
  ios: DeclaredPermissionInfo[];
} = {
  android: [
    {
      name: 'CAMERA',
      purpose: 'Quét mã vạch/QR & chụp ảnh bằng chứng',
      runtime: true,
    },
    {
      name: 'RECORD_AUDIO',
      purpose: 'Micro cho cuộc gọi tổng đài',
      runtime: true,
    },
    {
      name: 'POST_NOTIFICATIONS',
      purpose: 'Hiển thị thông báo (Android 13+)',
      runtime: true,
    },
    {
      name: 'READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE',
      purpose: 'Chọn ảnh từ thư viện',
      runtime: true,
    },
    {
      name: 'WRITE_EXTERNAL_STORAGE',
      purpose: 'Lưu ảnh đã chụp (Android ≤ 9)',
      runtime: false,
    },
    {
      name: 'SYSTEM_ALERT_WINDOW',
      purpose: 'Hiển thị cuộc gọi trên các ứng dụng khác',
      runtime: false,
    },
    {
      name: 'MANAGE_OWN_CALLS / BIND_TELECOM_CONNECTION_SERVICE',
      purpose: 'CallKeep dựng màn cuộc gọi đến',
      runtime: false,
    },
    {
      name: 'FOREGROUND_SERVICE / FOREGROUND_SERVICE_PHONE_CALL',
      purpose: 'Giữ dịch vụ cuộc gọi khi chạy nền',
      runtime: false,
    },
    {
      name: 'USE_FULL_SCREEN_INTENT',
      purpose: 'Cuộc gọi toàn màn hình khi khoá máy',
      runtime: false,
    },
    {
      name: 'READ_PHONE_STATE / READ_PHONE_NUMBERS / CALL_PHONE',
      purpose: 'Telecom cho CallKeep',
      runtime: false,
    },
    {
      name: 'WAKE_LOCK / RECEIVE_BOOT_COMPLETED / DISABLE_KEYGUARD',
      purpose: 'Đánh thức máy để nhận cuộc gọi / thông báo',
      runtime: false,
    },
    {
      name: 'INTERNET / ACCESS_NETWORK_STATE / VIBRATE',
      purpose: 'Kết nối mạng & rung báo',
      runtime: false,
    },
  ],
  ios: [
    {
      name: 'NSCameraUsageDescription',
      purpose: 'Camera quét mã & chụp ảnh',
      runtime: true,
    },
    {
      name: 'NSMicrophoneUsageDescription',
      purpose: 'Micro cuộc gọi tổng đài',
      runtime: true,
    },
    {
      name: 'NSPhotoLibraryUsageDescription',
      purpose: 'Chọn ảnh bằng chứng',
      runtime: true,
    },
    {
      name: 'NSLocalNetworkUsageDescription',
      purpose: 'Kết nối máy in qua mạng LAN',
      runtime: true,
    },
    {
      name: 'Push Notifications (APNs)',
      purpose: 'Thông báo đẩy',
      runtime: true,
    },
    {
      name: 'UIBackgroundModes: voip',
      purpose: 'Nhận cuộc gọi VoIP khi chạy nền',
      runtime: false,
    },
    {
      name: 'UIBackgroundModes: audio',
      purpose: 'Giữ âm thanh cuộc gọi khi chạy nền',
      runtime: false,
    },
    {
      name: 'UIBackgroundModes: remote-notification',
      purpose: 'Nhận push khi chạy nền',
      runtime: false,
    },
  ],
};
