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
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

// Import  global CSS file
import { useSetFCMRegistrationToken } from '@/api/employee/useSetFCMRegistrationToken';
import { APIProvider } from '@/api/shared';
import Loading from '@/components/Loading';
import { hydrateAuth, useAuth } from '@/core';
import { useCodepush } from '@/core/hooks/useCodePush';
import useHandleDeepLink from '@/core/hooks/useHandleDeepLink';
import { useProtectedRoute } from '@/core/hooks/useProtectedRoute';
import { usePushNotifications } from '@/core/hooks/usePushNotifications';
import { hydrateConfig } from '@/core/store/config';
import { useLoading } from '@/core/store/loading';
import { initConfigDate, setDefaultTimeZone } from '@/core/utils/moment';
import '@/ui/global.css';
import * as Updates from 'expo-updates';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertDialog from '../components/AlertDialog';
import NetworkStatus from '../components/NetWorkStatus';

const VERSION = '1.0.41';

const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { token } = usePushNotifications();
  const status = useAuth.use.status();

  const {
    isUpdateAvailable,
  } = Updates.useUpdates();

  const { isDoneCodepush} = useCodepush();

  const { mutate: setFCMRegistrationToken, data } =
    useSetFCMRegistrationToken();

  console.log(data, 'TOKEN-data');

  useEffect(() => {
    if (token && status === 'signIn') {
      setFCMRegistrationToken({ token: token });
    }
  }, [token, status]);

  if(!isDoneCodepush && isUpdateAvailable) {
    return <Loading description="Đang cập nhật phiên bản mới..." />
  }

  return (
    <>
      {children}
    </>
  );
};

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

hydrateAuth();
hydrateConfig();
initConfigDate();
setDefaultTimeZone();

SplashScreen.preventAutoHideAsync();

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  useProtectedRoute();
  useHandleDeepLink();
  return <>{children}</>;
};

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useReactNavigationDevTools(navigationRef);
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const [appState, setAppState] = useState(AppState.currentState);

  // useEffect(() => {  
  //   const subscription = AppState.addEventListener('change', nextAppState => {  
  //     // Check for the current state of the app  
  //     if (appState.match(/inactive|background/) && nextAppState === 'active') {  
  //       queryClient.resetQueries();
  //     }  
  //     setAppState(nextAppState);  
  //   });  

  //   // Cleanup the subscription on unmount  
  //   return () => {  
  //     subscription.remove();  
  //   };  
  // }, [appState]);  

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
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="authorize" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const status = useAuth.use.status();
  const loading = useLoading.use.loading();

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
    <BottomSheetModalProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PortalProvider>
          <APIProvider>
            <NotificationWrapper>
              <AuthWrapper>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                  <NetworkStatus />
                  {loading && <Loading />}
                  {children}
                  <AlertDialog />
                </SafeAreaView>
                <AlertDialog />
                <FlashMessage
                  position="bottom"
                  duration={5000}
                  statusBarHeight={StatusBar.currentHeight}
                />
              </AuthWrapper>
            </NotificationWrapper>
          </APIProvider>
        </PortalProvider>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
