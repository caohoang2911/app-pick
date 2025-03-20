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

export const usePushNotifications: any = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );

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
    const fetchToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setToken(token);
      }
    };
    fetchToken();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }

    // Handle user clicking on a notification and open the screen
    const handleNotificationClick = async (response: any) => {
      const data  = response?.notification?.request?.content?.data || {};
      try {
        goOrderDetail(data)
      } catch {

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
        // navigation
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

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Message handled in the background!', remoteMessage);
      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data, // optional data payload
      };
      // Schedule the notification with a null trigger to show immediately

      await Notifications.scheduleNotificationAsync({
        content: notification,
        trigger: null,
      });

    });

    // Handle push notifications when the app is in the foreground
    const handlePushNotification = async (remoteMessage: any) => {

      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data, // optional data payload
      };

      queryClient.resetQueries({ queryKey: ['searchOrders'] });
      queryClient.resetQueries({ queryKey: ['getOrderStatusCounters'] });

      await Notifications.scheduleNotificationAsync({
        content: notification,
        trigger: null,
      });
    };

    // Listen for push notifications when the app is in the foreground
    const unsubscribe = messaging().onMessage(handlePushNotification);

    // Clean up the event listeners

    return () => {
      unsubscribe();
      notificationClickSubscription.remove();
    };
  }, []);

  return {
    token,
    channels,
  };
};
