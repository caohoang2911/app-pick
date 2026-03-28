import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Portal, PortalProvider } from '@gorhom/portal';
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar, StyleSheet, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

import { useSetFCMRegistrationToken } from '@/api/employee/useSetFCMRegistrationToken';
import { APIProvider } from '@/api/shared';
import Loading from '@/components/Loading';
import { hydrateAuth, useAuth } from '@/core';
import { useAutoUpdate } from '@/core/hooks/useAutoUpdate';
import { useCodepush } from '@/core/hooks/useCodePush';
import useHandleDeepLink from '@/core/hooks/useHandleDeepLink';
import { useProtectedRoute } from '@/core/hooks/useProtectedRoute';
import { usePushNotifications } from '@/core/hooks/usePushNotifications';
import { hydrateConfig } from '@/core/store/config';
import { useLoading } from '@/core/store/loading';
import { ErrorBoundary as CustomErrorBoundary } from '@/core/utils/error-boundary';
import { setDefaultTimeZone } from '@/core/utils/moment';
import { setupExpoModulesErrorHandler } from '@/core/utils/safe-expo-modules';

import '@/ui/global.css';
import * as Updates from 'expo-updates';
import React, { useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useWatchResponse } from '~/src/core/hooks/useWatchResponse';
import AlertDialog from '../components/AlertDialog';
import { AppStateEffect } from '../components/AppStateEffect';
import FlashMessageWithMarkdown from '../components/FlashMessageWithMarkdown';
import NetworkStatus from '../components/NetWorkStatus';
import { UpdateDownloadModal } from '../components/UpdateDownloadModal';
import { useAppState } from '../core/hooks/useAppState';
import {
  cleanupSafeAppManagement,
  initializeSafeAppManagement,
} from '../core/utils/safe-app-management';

// ─── NotificationWrapper ───────────────────────────────────────────────────────
// Nhận isDoneCodepush từ Providers để không gọi useCodepush 2 lần
const NotificationWrapper = ({
  children,
  isDoneCodepush,
}: {
  children: React.ReactNode;
  isDoneCodepush: boolean;
}) => {
  const { token } = usePushNotifications();
  const status = useAuth.use.status();
  const { isUpdateAvailable } = Updates.useUpdates();
  const { onFetchUpdateAsync } = useCodepush();
  const appState = useAppState();
  const { mutate: setFCMRegistrationToken } = useSetFCMRegistrationToken();

  useEffect(() => {
    if (token && status === 'signIn') {
      setFCMRegistrationToken({ token });
    }
  }, [token, status]);

  useEffect(() => {
    if (appState === 'active') {
      onFetchUpdateAsync();
    }
  }, [appState]);

  if (!isDoneCodepush && isUpdateAvailable) {
    return <></>;
  }

  return <>{children}</>;
};

// ─── Constants ────────────────────────────────────────────────────────────────
export const unstable_settings = {
  initialRouteName: '(drawer)',
};

hydrateAuth();
hydrateConfig();
setDefaultTimeZone();
SplashScreen.preventAutoHideAsync();

// ─── AuthWrapper ──────────────────────────────────────────────────────────────
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  useProtectedRoute();
  useHandleDeepLink();
  useWatchResponse();
  return <>{children}</>;
};

// ─── RootLayout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useReactNavigationDevTools(navigationRef);
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Providers>
      <Stack
        initialRouteName="(drawer)"
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: 'none' }}
        />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="authorize" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

// ─── Providers ────────────────────────────────────────────────────────────────
function Providers({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const status = useAuth.use.status();
  const loading = useLoading.use.loading();

  const { isUpdateAvailable } = Updates.useUpdates();

  // ✅ CodePush chạy trước
  const { isDoneCodepush } = useCodepush();

  // ✅ GitHub auto-update chỉ chạy sau khi CodePush xong
  const { isChecking, progress, isDownloading } = useAutoUpdate({
    enabled: isDoneCodepush,
  });

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

  useEffect(() => {
    setupExpoModulesErrorHandler();
    initializeSafeAppManagement();
    return () => {
      cleanupSafeAppManagement();
    };
  }, []);

  if (!loaded && !error) return null;

  return (
    <CustomErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error, errorInfo);
      }}
    >
      <BottomSheetModalProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PortalProvider>
            <APIProvider>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flex: 1 }}
                  pointerEvents={isDownloading ? 'none' : 'auto'}
                  collapsable={false}
                >
                  {/* Block toàn màn hình: check + tải APK (giống Android) — AlertDialog mount bên ngoài để vẫn bấm được khi isChecking */}
                  {!isDoneCodepush && isUpdateAvailable ? (
                    <Loading description="Đang tải bản cập nhật mới..." />
                  ) : isChecking && !isDownloading ? (
                    <Loading description="Đang kiểm tra cập nhật..." />
                  ) : isDownloading ? (
                    <Loading description="Đang tải bản cập nhật..." />
                  ) : (
                    <NotificationWrapper isDoneCodepush={isDoneCodepush}>
                      <AuthWrapper>
                        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                          <NetworkStatus />
                          {loading && <Loading />}
                          {children}
                        </SafeAreaView>
                      </AuthWrapper>
                    </NotificationWrapper>
                  )}
                </View>

                <AlertDialog />

                <AppStateEffect />

                <UpdateDownloadModal
                  visible={isDownloading}
                  progress={progress}
                />

                {/* Portal + zIndex/elevation: trên BottomSheet modal (@gorhom) */}
                <Portal>
                  <View
                    pointerEvents="box-none"
                    style={[
                      StyleSheet.absoluteFillObject,
                      { zIndex: 999_999, elevation: 999_999 },
                    ]}
                  >
                    <FlashMessage
                      position="bottom"
                      duration={5000}
                      style={{
                        paddingRight: 36,
                        paddingBottom: Math.max(insets.bottom, 8),
                      }}
                      statusBarHeight={StatusBar.currentHeight}
                      MessageComponent={FlashMessageWithMarkdown}
                    />
                  </View>
                </Portal>
              </View>
            </APIProvider>
          </PortalProvider>
        </GestureHandlerRootView>
      </BottomSheetModalProvider>
    </CustomErrorBoundary>
  );
}
