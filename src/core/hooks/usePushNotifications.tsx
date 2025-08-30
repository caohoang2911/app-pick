import { registerForPushNotificationsAsync } from '@/core/utils/notification';
import messaging from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import { setInviteBottomSheetVisible } from '../store/employee-manage';

export enum TargetScreen {
  ORDER_PICK = 'ORDER-PICK',
  ORDER_INVOICE = 'ORDER-INVOICE',
  ORDER_LISTING = 'ORDER-LISTING',
}

export enum ActionFromNotification {
  SHOW_POPUP_INVITE_STORE_EMPLOYEE = 'SHOW_POPUP_INVITE_STORE_EMPLOYEE',
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
  const appState = useRef(AppState.currentState);
  const navigationInProgress = useRef(false);
  const pathname = usePathname();

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

  const handleShowPopupInviteStoreEmployee = useCallback((inviteToken: string, storeCode: string, action: ActionFromNotification) => {
    
  }, []);

  const handleGoScreen = useCallback((remoteMessage: any) => {
    const { orderCode, targetScr, action, inviteToken, storeCode } = remoteMessage || {};

    // if (!orderCode || navigationInProgress.current) return;
    
    // Đánh dấu đang trong quá trình chuyển hướng để tránh nhiều lần gọi liên tiếp
    navigationInProgress.current = true;
    
    // Sử dụng InteractionManager để đảm bảo các tác vụ UI hoàn tất trước khi chuyển hướng
    InteractionManager.runAfterInteractions(() => {
      try {
          switch (targetScr) {
            case TargetScreen.ORDER_PICK:
              router.push(`/orders/order-detail/${orderCode}`);
              break;
            case TargetScreen.ORDER_INVOICE:
              router.push(`/orders/order-invoice/${orderCode}`);
              break;
            case TargetScreen.ORDER_LISTING:
              // For invite actions, navigate to orders first, then set params
              // router.replace('/orders');
              if (action === ActionFromNotification.SHOW_POPUP_INVITE_STORE_EMPLOYEE) {
                // Set params after navigation with a small delay to ensure component is mounted
                setTimeout(() => {
                  router.setParams({
                    inviteToken: inviteToken,
                    storeCode: storeCode,
                    action: action
                  });
                }, 100);
              }
              break;
            default:
              break;
          }
      
        
        // Đặt lại cờ sau khi chuyển hướng hoàn tất
        navigationInProgress.current = false;
      } catch (error) {
        console.error('Navigation error:', error);
        navigationInProgress.current = false;
      }
    });
  }, [pathname]);

  useEffect(() => {
    // Theo dõi trạng thái ứng dụng để xử lý đúng khi chuyển từ background sang foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App vừa được mở lại từ background, reset cờ navigation
        navigationInProgress.current = false;
      }
      appState.current = nextAppState;
    });

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
        handleGoScreen(data)
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

      handleGoScreen(remoteMessage?.data)
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
          handleGoScreen(remoteMessage?.data)
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
        // Handle foreground notifications by setting params like background clicks
        const { action, inviteToken, storeCode } = remoteMessage.data || {};

        switch (action) {
          case ActionFromNotification.SHOW_POPUP_INVITE_STORE_EMPLOYEE:
            setInviteBottomSheetVisible(true)
            router.setParams({
              inviteToken: inviteToken,
              storeCode: storeCode,
              action: action
            });
            break;
          default:
            break;
        }

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
      subscription.remove();
    };
  }, [handleGoScreen, queryClient]);

  return {
    token,
    channels,
  };
};
