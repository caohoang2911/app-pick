import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
// import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import {
  isDeviceSilentOrZeroVolume,
  DEFAULT_VOLUME_THRESHOLD,
} from '~/src/core/utils/deviceSoundState';

export interface CheckNotificationPermissionOptions {
  /** Ngưỡng volume (0–1) để coi là "tắt tiếng", mặc định 0.2 (20%). */
  volumeThreshold?: number;
}

/**
 * Checks if notification permissions are granted
 * If not, shows a popup asking user to enable notifications
 * @param onPermissionGranted Callback function to execute when permission is granted
 * @param isDoneCodepush If true, will show popup/request permission. If false, will skip (wait for codepush to complete)
 * @param options volumeThreshold: ngưỡng âm lượng (0–1) để cảnh báo, mặc định 0.2
 */
export const checkNotificationPermission = async (
  onPermissionGranted?: () => void,
  isDoneCodepush: boolean = true,
  options?: CheckNotificationPermissionOptions,
): Promise<boolean> => {
  // Wait for code push to complete before showing permission popup
  if (!isDoneCodepush) {
    console.log(
      '[NotificationPermission] Waiting for code push to complete...',
    );
    return false;
  }

  // Check if physical device (notifications won't work on simulators)
  // if (!Device.isDevice) {
  //   console.log('Notifications not available on simulator/emulator');
  //   return false;
  // }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If permission not determined, request it
  if (existingStatus !== 'granted') {
    // If we should show the request dialog
    if (existingStatus === 'undetermined') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    } else {
      // Permission was previously denied
      showNotificationPermissionPopup();
      return false;
    }
  }

  // If permission granted, call callback rồi check thiết bị silent → show popup nhắc âm thanh
  if (finalStatus === 'granted') {
    onPermissionGranted?.();
    const isSilent = await isDeviceSilentOrZeroVolume(
      options?.volumeThreshold != null
        ? { volumeThreshold: options.volumeThreshold }
        : undefined,
    );
    if (isSilent) {
      showSoundOffWarningPopup(
        options?.volumeThreshold ?? DEFAULT_VOLUME_THRESHOLD,
      );
    }
    return true;
  }

  return false;
};

/**
 * Shows a popup explaining why notifications are important
 * and guides user to settings to enable them
 */
export const showNotificationPermissionPopup = () => {
  showAlert({
    title: 'Thông báo quan trọng',
    message:
      'Bạn cần cho phép ứng dụng gửi thông báo để nhận được cập nhật về đơn hàng và các thông tin quan trọng khác.',
    cancelText: 'Để sau',
    confirmText: 'Mở cài đặt',
    onConfirm: () => {
      hideAlert();
      openAppSettings();
    },
  });
};

/**
 * Popup khi đã có quyền thông báo nhưng thiết bị đang tắt tiếng / silent / âm lượng rất thấp.
 * @param volumeThreshold Ngưỡng đã dùng (0–1), dùng để hiển thị % trong message nếu cần
 */
export const showSoundOffWarningPopup = (
  volumeThreshold: number = DEFAULT_VOLUME_THRESHOLD,
) => {
  const percent = Math.round(volumeThreshold * 100);
  showAlert({
    title: 'Âm thanh thông báo',
    message: `Thiết bị đang ở chế độ im lặng hoặc âm lượng rất thấp (dưới ${percent}%). Hãy bật âm thanh để nghe thông báo về đơn hàng.`,
    cancelText: 'Để sau',
    isHideConfirmButton: true,
    onConfirm: () => {
      hideAlert();
      openAppSettings();
    },
  });
};

/**
 * Opens app settings so user can enable notifications
 */
const openAppSettings = () => {
  try {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      // For Android
      Linking.openSettings();
    }
  } catch (err) {
    console.error('Could not open settings', err);
  }
};
