import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';

/**
 * Checks if notification permissions are granted
 * If not, shows a popup asking user to enable notifications
 * @param onPermissionGranted Callback function to execute when permission is granted
 */
export const checkNotificationPermission = async (onPermissionGranted?: () => void): Promise<boolean> => {
  // Check if physical device (notifications won't work on simulators)
  if (!Device.isDevice) {
    console.log('Notifications not available on simulator/emulator');
    return false;
  }

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
      // Permission was previously denied, show custom popup
      showNotificationPermissionPopup();
      return false;
    }
  }

  // If permission granted, call callback
  if (finalStatus === 'granted') {
    onPermissionGranted?.();
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
    message: 'Bạn cần cho phép ứng dụng gửi thông báo để nhận được cập nhật về đơn hàng và các thông tin quan trọng khác.',
    cancelText: 'Để sau',
    confirmText: 'Mở cài đặt',
    onConfirm: () => {
      hideAlert();
      openAppSettings()
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