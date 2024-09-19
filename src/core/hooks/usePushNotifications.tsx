import { registerForPushNotificationsAsync } from '@/core/utils/notification';
import messaging from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export const usePushNotifications: any = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );

  const [notification1, setNotification] = useState<any>(undefined);
  const extraDataRef: any = useRef<{orderCode: string}>();

  const pathname = usePathname();

  const goOrderDetail = (remoteMessage: any) => {
    const { orderCode, targetScr} = remoteMessage?.data || {};
    if (orderCode !== null) {
      if(pathname.includes('/orders/')){
        if(targetScr === 'ORDER-PICK') {
          router.replace(`orders/${orderCode}`)  
        } else {
          router.replace(`order-invoice/${orderCode}`)  
        }
      } else {
        if(targetScr === 'ORDER-PICK') {
          router.push(`orders/${orderCode}`)  
        } else {
          router.push(`order-invoice/${orderCode}`)  
        }
      }
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => token && setToken(token)
    );

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
      try {
        const orderCode = extraDataRef.current.orderCode

        if (orderCode !== null) {
          goOrderDetail({data: { orderCode }})
        }
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
        remoteMessage.data.screen
        // navigation
      );
      const orderCode = remoteMessage?.data?.orderCode
      if (orderCode !== null) {
        goOrderDetail(remoteMessage)
      }
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

          const orderCode = remoteMessage?.data?.orderCode;
          if (orderCode !== null) {
            goOrderDetail(remoteMessage)
          }
        }
      });

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Message handled in the background!', remoteMessage);
      const notification = {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data, // optional data payload
      };
      setNotification(notification);
      // Schedule the notification with a null trigger to show immediately

      extraDataRef.current = remoteMessage.data

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

      extraDataRef.current = remoteMessage.data

      setNotification(notification);

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
  }, [pathname]);

  return {
    token,
    channels,
    notification: notification1,
  };
};
