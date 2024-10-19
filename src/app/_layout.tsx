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
import { useProtectedRoute } from '@/core/hooks/useProtectedRoute';
import { usePushNotifications } from '@/core/hooks/usePushNotifications';
import { hydrateConfig } from '@/core/store/config';
import '@/ui/global.css';
import React, { useCallback, useEffect } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCodepush } from '@/core/hooks/useCodePush';
import useHandleDeepLink from '@/core/hooks/useHandleDeepLink';
import { useLoading } from '@/core/store/loading';
import { initConfigDate } from '@/core/utils/moment';
import AlertDialog from '../components/AlertDialog';
import * as Updates from 'expo-updates';
import NetworkStatus from '../components/NetWorkStatus';

const VERSION = '1.0.40';

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
    return <Loading description="Đang cập nhật..." />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <APIProvider>
          <NotificationWrapper>
            <AuthWrapper>
              <BottomSheetModalProvider>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                  <NetworkStatus />
                  {loading && <Loading />}
                  <View className="absolute bottom-3 right-5 z-10">
                    <Text className="text-gray-500 text-xs">
                      {`Development ${VERSION}`}
                    </Text>
                  </View>
                  {children}
                  <AlertDialog />
                </SafeAreaView>
                <AlertDialog />
                <FlashMessage
                  position="top"
                  duration={5000}
                  statusBarHeight={StatusBar.currentHeight}
                />
              </BottomSheetModalProvider>
            </AuthWrapper>
          </NotificationWrapper>
        </APIProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
