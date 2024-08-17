import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalProvider } from '@gorhom/portal';
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

// Import  global CSS file
import { useSendFCMNotification } from '@/api/employee/useSendFCMNotification';
import { useSetFCMRegistrationToken } from '@/api/employee/useSetFCMRegistrationToken';
import { APIProvider } from '@/api/shared';
import Loading from '@/components/Loading';
import { hydrateAuth, useAuth } from '@/core';
import { useProtectedRoute } from '@/core/hooks/useProtectedRoute';
import { usePushNotifications } from '@/core/hooks/usePushNotifications';
import '@/ui/global.css';
import React, { useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { token, notification } = usePushNotifications();
  const data = JSON.stringify(notification, undefined, 2);

  const { mutate: setFCMRegistrationToken, isPending } =
    useSetFCMRegistrationToken();

  const { mutate: sendFCMNotification } = useSendFCMNotification();

  useEffect(() => {
    if (token) {
      console.log(token, 'expoPushToken');
      setFCMRegistrationToken(
        { token: token },
        {
          onSuccess: (data: any) => {
            console.log(data, 'data');
          },
          onError: (err: any) => {
            console.log(err, 'err');
            // showErrorMessage('Error adding post');
          },
        }
      );
    }
  }, [token]);

  const handleSendNotice = () => {
    sendFCMNotification(
      {
        title: 'Cao Hoàng',
        body: 'Tuyết Giang',
        screen: 'orders/1',
      },
      {
        onSuccess: (data: any) => {
          console.log(data, 'data');
        },
        onError: (err: any) => {
          console.log(err, 'err');
          // showErrorMessage('Error adding post');
        },
      }
    );
  };

  return (
    <>
      {/* <Text>Token: {JSON.stringify(token)}</Text>
      <ScrollView>
        <Text>Notification: {data}</Text>
      </ScrollView>
      <Button label="Send notice" onPress={handleSendNotice} />
      <Button label="Send notice schedule" onPress={schedulePushNotification} /> */}
      {children}
    </>
  );
};

export const unstable_settings = {
  initialRouteName: 'orders',
};

hydrateAuth();
SplashScreen.preventAutoHideAsync();

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  useProtectedRoute();
  return <>{children}</>;
};

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useReactNavigationDevTools(navigationRef);
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="authorize" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const status = useAuth.use.status();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || (error && status !== 'idle')) {
      hideSplash();
    }
  }, [loaded, error]);

  if (!loaded) {
    return <Loading />;
  }

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <StatusBar style="dark" />
        <APIProvider>
          <NotificationWrapper>
            <AuthWrapper>
              <BottomSheetModalProvider>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                  {children}
                </SafeAreaView>
                <FlashMessage position="top" />
              </BottomSheetModalProvider>
            </AuthWrapper>
          </NotificationWrapper>
        </APIProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
