import { registerForPushNotificationsAsync } from '@/core/utils/notification';
import messaging from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export enum TargetScreen {
  ORDER_PICK = 'ORDER-PICK',
  ORDER_INVOICE = 'ORDER-INVOICE',
}

// Set notification handler outside component for global configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const usePushNotifications: any = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);

  // Create Android notification channel with sound
  const createAndroidChannel = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default_channel_id', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'ding.mp3', // This references the sound file in res/raw directory
      });
    }
  };

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

  useEffect(() => {
    // Configure Android notification channel
    createAndroidChannel();

    // Chỉ cấu hình đặc biệt cho iOS
    const configureIOS = async () => {
      if (Platform.OS === 'ios') {
        // Cần thiết cho thông báo nền iOS có âm thanh
        await messaging().setAutoInitEnabled(true);
        
        // Yêu cầu quyền iOS với âm thanh được bật
        const authStatus = await messaging().requestPermission({
          alert: true,
          badge: true,
          sound: true,
          announcement: false,
          provisional: false,
        });

        console.log('iOS permission status:', authStatus);
      }
    };

    const fetchToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setToken(token);
      }
    };
    
    // Chạy thiết lập
    fetchToken();
    
    // Chỉ cấu hình iOS riêng
    if (Platform.OS === 'ios') {
      configureIOS();
    } else if (Platform.OS === 'android') {
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
        // iOS requires specific structure for sound to work
        if (Platform.OS === 'ios') {
          // Xử lý đặc biệt cho iOS để phát âm thanh thông báo khi ở nền
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title || 'Thông báo mới',
              body: remoteMessage.notification?.body || '',
              data: {
                ...remoteMessage.data,
                // iOS cần cấu trúc APS đặc biệt để phát âm thanh
                aps: {
                  sound: 'ding.mp3',
                  badge: 1,
                  "content-available": 1
                }
              },
              sound: 'ding.mp3', // Use custom sound instead of default
            },
            trigger: null,
          });
        } else {
          // Android background notification with sound
          const notification = {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
            sound: 'ding.mp3', // Reference to sound file in res/raw
            channelId: 'default_channel_id',
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

        // Xử lý riêng cho iOS và Android
        if (Platform.OS === 'ios') {
          // iOS foreground notifications có cấu trúc đặc biệt 
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title || '',
              body: remoteMessage.notification?.body || '',
              data: {
                ...remoteMessage.data,
                // Cấu hình âm thanh iOS
                aps: {
                  sound: 'ding.mp3',
                  badge: 1,
                  "content-available": 1
                }
              },
              sound: 'ding.mp3', // Use custom sound instead of default
            },
            trigger: null,
          });
        } else {
          // Android foreground notification with sound
          const notification = {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
            sound: 'ding.mp3', // Reference to sound file in res/raw
            channelId: 'default_channel_id',
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

    // Clean up the event listeners
    return () => {
      unsubscribe();
      notificationClickSubscription.remove();
    };
  }, [goOrderDetail, queryClient]);

  return {
    token,
    channels,
  };
};
