import { registerForPushNotificationsAsync } from '@/core/utils/notification';
import messaging from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { getItem, setItem } from '@/core/storage';

export enum TargetScreen {
  ORDER_PICK = 'ORDER-PICK',
  ORDER_INVOICE = 'ORDER-INVOICE',
}

// Custom sound file names
const IOS_NOTIFICATION_SOUND = 'notification.wav'; // Make sure this file is added to the iOS project

// IMPORTANT: Xcode configuration steps for background sound:
// 1. Add notification.wav to Xcode project - select "Create folder references"
// 2. In AppDelegate.mm, add the following to didReceiveRemoteNotification:
//    - UNMutableNotificationContent *content = [UNMutableNotificationContent new];
//    - content.sound = [UNNotificationSound soundNamed:@"notification.wav"];
//    - UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:@"backgroundSound" content:content trigger:nil];
//    - [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:nil];

// Set notification handler outside component for global configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Storage keys
const FCM_TOKEN_KEY = 'fcm_token';
const USER_SESSION_KEY = 'user_session';

export const usePushNotifications: any = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
  const appState = useRef(AppState.currentState);

  const goOrderDetail = useCallback((remoteMessage: any) => {
    const { orderCode, targetScr} = remoteMessage || {};

    if (orderCode) {
      if(targetScr === TargetScreen.ORDER_PICK) {
        router.push(`orders/order-detail/${orderCode}`)  
      } else {
        router.push(`orders/order-invoice/${orderCode}`)  
      }
    }
  }, [router])

  // Persist FCM token and ensure session persistence
  const persistFCMToken = useCallback(async (fcmToken: string) => {
    try {
      if (fcmToken) {
        // Store FCM token
        await setItem(FCM_TOKEN_KEY, fcmToken);
        
        // For Android, ensure session persistence
        if (Platform.OS === 'android') {
          // Check if we have an existing session
          const existingSession = getItem<any>(USER_SESSION_KEY);
          if (existingSession) {
            // Refresh the session timestamp to keep it alive
            existingSession.lastRefreshed = new Date().toISOString();
            await setItem(USER_SESSION_KEY, existingSession);
            console.log('Android session refreshed');
          }
        }
      }
    } catch (error) {
      console.log('Error persisting FCM token:', error);
    }
  }, []);

  useEffect(() => {
    // Monitor app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      // When app returns to foreground, check push notification permissions
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        if (Platform.OS === 'ios') {
          configureIOS();
        }
      }
      
      appState.current = nextAppState;
    });

    // Chỉ cấu hình đặc biệt cho iOS
    const configureIOS = async () => {
      if (Platform.OS === 'ios') {
        try {
          // Cần thiết cho thông báo nền iOS có âm thanh
          await messaging().setAutoInitEnabled(true);
          
          // Register for remote notifications with full permissions
          await messaging().registerDeviceForRemoteMessages();
          
          // Yêu cầu quyền iOS với âm thanh được bật - đặt criticalAlert thành true
          const authStatus = await messaging().requestPermission({
            alert: true,
            badge: true,
            sound: true,
            announcement: true,
            provisional: true, // Cho phép thông báo tạm thời không cần người dùng chấp nhận
            criticalAlert: true, // Cho phép âm thanh ngay cả khi điện thoại ở chế độ im lặng
          });
          
          // Đảm bảo có quyền gửi thông báo đặc biệt
          const permissionResult = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
              allowCriticalAlerts: true, // Quan trọng cho âm thanh nền
              provideAppNotificationSettings: true,
              allowProvisional: true,
            },
          });

          console.log('iOS permission status:', authStatus);
          console.log('Expo notification permissions:', permissionResult);
          
          // Tạo custom channel cho iOS (mặc dù iOS không sử dụng channel như Android)
          if (Device.isDevice) {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Default',
              importance: Notifications.AndroidImportance.MAX,
              sound: Platform.OS === 'ios' ? IOS_NOTIFICATION_SOUND : 'default',
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });

            // Cấu hình thiết lập cho âm thanh nền
            await Notifications.setNotificationCategoryAsync('order', [
              {
                identifier: 'confirm',
                buttonTitle: 'Xem',
                options: {
                  opensAppToForeground: true,
                }
              }
            ], {
              previewPlaceholder: 'Thông báo đơn hàng'
            });
            
            // Kiểm tra và log các channel thông báo
            const channels = await Notifications.getNotificationChannelsAsync();
            console.log('Available notification channels:', channels);
            
            // Kiểm tra và log các notification categories
            const categories = await Notifications.getNotificationCategoriesAsync();
            console.log('Available notification categories:', categories);
          }
        } catch (error) {
          console.log('Error configuring iOS notifications:', error);
        }
      }
    };

    const fetchToken = async () => {
      // Try to get token from storage first
      try {
        const storedToken = getItem<string>(FCM_TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          console.log('Retrieved FCM token from storage');
        }
      } catch (e) {
        console.log('Error retrieving stored token:', e);
      }

      // Get fresh token
      const fcmToken = await registerForPushNotificationsAsync();
      if (fcmToken) {
        setToken(fcmToken);
        persistFCMToken(fcmToken);
      }
    };
    
    // Chạy thiết lập
    fetchToken();
    
    // Chỉ cấu hình iOS riêng
    if (Platform.OS === 'ios') {
      configureIOS();
    } else if (Platform.OS === 'android') {
      // Android specific setup
      messaging().onTokenRefresh((newToken) => {
        // When FCM token refreshes, update storage and state
        setToken(newToken);
        persistFCMToken(newToken);
      });
      
      // Giữ nguyên logic Android hiện tại
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }

    // Handle user clicking on a notification and open the screen
    const handleNotificationClick = async (response: any) => {
      const data = response?.notification?.request?.content?.data || {};
      try {
        goOrderDetail(data)
      } catch (error) {
        console.log('Error handling notification click:', error);
      }
    };

    const notificationClickSubscription =
      Notifications.addNotificationResponseReceivedListener(async (data: any) => {
        handleNotificationClick(data);
      });

    // Handle user opening the app from a notification (when the app is in the background)
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.data
      );

      goOrderDetail(remoteMessage?.data)
    });

    // Check if the app was opened from a notification (when the app was completely quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage
          );
          goOrderDetail(remoteMessage?.data)
        }
      });

    // Handle background messages (critical for iOS sound)
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Message handled in the background!', remoteMessage);
      
      try {
        // Đặc biệt quan trọng cho iOS để phát âm thanh nền
        if (Platform.OS === 'ios') {
          // Tái cấu trúc thông báo cho iOS để đảm bảo âm thanh hoạt động
          const notificationIdentifier = `ios-notification-${Date.now()}`;
          
          // Cấu trúc nội dung thông báo iOS
          await Notifications.scheduleNotificationAsync({
            identifier: notificationIdentifier,
            content: {
              title: remoteMessage.notification?.title || 'Thông báo mới',
              body: remoteMessage.notification?.body || '',
              data: {
                ...remoteMessage.data,
                iosCustomData: true,
                _displayInForeground: true,
                _sound: IOS_NOTIFICATION_SOUND, // Chỉ định âm thanh qua data
              },
              sound: IOS_NOTIFICATION_SOUND, // Sử dụng âm thanh tùy chỉnh
              badge: 1,
              sticky: true, // Giữ thông báo 
              priority: Notifications.AndroidNotificationPriority.MAX, // Ưu tiên cao nhất
              color: '#FF0000',
              vibrate: [0, 250, 250, 250],
              categoryIdentifier: 'order', // Liên kết với category đã tạo
            },
            trigger: {
              channelId: 'default',
              seconds: 0.1, // Chỉ chờ 0.1 giây để hiển thị
            },
          });
          
          console.log('iOS background notification scheduled with ID:', notificationIdentifier);
        } else {
          // Ensure Android session persistence on background notifications
          try {
            const existingSession = getItem<any>(USER_SESSION_KEY);
            if (existingSession) {
              existingSession.lastRefreshed = new Date().toISOString();
              await setItem(USER_SESSION_KEY, existingSession);
              console.log('Android session refreshed from background');
            }
          } catch (e) {
            console.log('Error refreshing session:', e);
          }
          
          // Giữ nguyên xử lý Android
          const notification = {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
          };
          await Notifications.scheduleNotificationAsync({
            content: notification,
            trigger: null,
          });
        }
      } catch (error) {
        console.log('Error scheduling background notification:', error);
      }
    });

    // Handle push notifications when the app is in the foreground
    const handlePushNotification = async (remoteMessage: any) => {
      try {
        queryClient.resetQueries({ queryKey: ['searchOrders'] });
        queryClient.resetQueries({ queryKey: ['getOrderStatusCounters'] });

        // Refresh session on each foreground notification
        if (Platform.OS === 'android') {
          try {
            const existingSession = getItem<any>(USER_SESSION_KEY);
            if (existingSession) {
              existingSession.lastRefreshed = new Date().toISOString();
              await setItem(USER_SESSION_KEY, existingSession);
              console.log('Android session refreshed from foreground notification');
            }
          } catch (e) {
            console.log('Error refreshing session:', e);
          }
        }

        // Xử lý riêng cho iOS và Android
        if (Platform.OS === 'ios') {
          // Tạo thông báo iOS với ID duy nhất
          const foregroundNotificationId = `ios-foreground-${Date.now()}`;
          
          // iOS foreground notifications với cấu trúc tối ưu
          await Notifications.scheduleNotificationAsync({
            identifier: foregroundNotificationId,
            content: {
              title: remoteMessage.notification?.title || '',
              body: remoteMessage.notification?.body || '',
              data: {
                ...remoteMessage.data,
                _displayInForeground: true,
                _sound: IOS_NOTIFICATION_SOUND,
              },
              sound: IOS_NOTIFICATION_SOUND, // Sử dụng âm thanh tùy chỉnh
              badge: 1,
              categoryIdentifier: 'order', // Liên kết với category đã tạo
            },
            trigger: null,
          });
          
          console.log('iOS foreground notification scheduled with ID:', foregroundNotificationId);
        } else {
          // Giữ nguyên xử lý Android hiện tại
          const notification = {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
          };
          await Notifications.scheduleNotificationAsync({
            content: notification,
            trigger: null,
          });
        }
      } catch (error) {
        console.log('Error handling foreground notification:', error);
      }
    };

    // Listen for push notifications when the app is in the foreground
    const unsubscribe = messaging().onMessage(handlePushNotification);

    // Setup periodic session refresh for Android (every 15 minutes)
    let intervalId: NodeJS.Timeout | null = null;
    if (Platform.OS === 'android') {
      intervalId = setInterval(async () => {
        try {
          const existingSession = getItem<any>(USER_SESSION_KEY);
          if (existingSession) {
            existingSession.lastRefreshed = new Date().toISOString();
            await setItem(USER_SESSION_KEY, existingSession);
            console.log('Android session refreshed by interval');
          }
        } catch (e) {
          console.log('Error in periodic session refresh:', e);
        }
      }, 15 * 60 * 1000); // 15 minutes
    }

    // Clean up the event listeners
    return () => {
      unsubscribe();
      notificationClickSubscription.remove();
      subscription.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, [goOrderDetail, queryClient, persistFCMToken]);

  return {
    token,
    channels,
  };
};
