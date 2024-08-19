import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '@/core/utils/notification';
import { usePathname } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export const usePushNotifications: any = () => {
  const queryClient = useQueryClient();

  const [token, setToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );

  const [notification, setNotification] = useState<any>(undefined);
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
      console.log(response?.notification?.request?.content, 'response');
      const screen = response?.notification?.request?.content?.data?.screen;
      if (screen !== null) {
        // router.push('order-pick/1');
      }
    };

    const notificationClickSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationClick
      );

    // Handle user opening the app from a notification (when the app is in the background)
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.data.screen
        // navigation
      );
      if (remoteMessage?.data?.screen) {
        // navigation.navigate(`${remoteMessage.data.screen}`);
      }
    });

    // Check if the app was opened from a notification (when the app was completely quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification
          );
          if (remoteMessage?.data?.screen) {
            // navigation.navigate(`${remoteMessage.data.screen}`);
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
    notification,
  };
};
