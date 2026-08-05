// Tắt phóng to chữ theo máy (allowFontScaling=false) — phải chạy trước khi UI render.
import '@/core/utils/disable-font-scaling';

import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Portal, PortalProvider } from '@gorhom/portal';
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router';
import { Platform, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import FlashMessage, { hideMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// `onShow` được hỗ trợ ở runtime nhưng thiếu trong type defs của lib.
declare module 'react-native-flash-message' {
  interface FlashMessageProps {
    onShow?: () => void;
  }
}

export { ErrorBoundary } from 'expo-router';

import { useSetFCMRegistrationToken } from '@/api/employee/use-set-fcm-registration-token';
import { APIProvider } from '@/api/shared';
import Loading from '@/components/Loading';
import { hydrateAuth, useAuth } from '@/core';
import { useAutoUpdate } from '@/core/hooks/useAutoUpdate';
import { useCodepush } from '@/core/hooks/useCodePush';
import useHandleDeepLink from '@/core/hooks/useHandleDeepLink';
import { usePdaScan } from '@/core/hooks/usePdaScan';
import { useProtectedRoute } from '@/core/hooks/useProtectedRoute';
import { usePushNotifications } from '@/core/hooks/usePushNotifications';
import { useStringeeCall } from '@/core/hooks/useStringeeCall';
import { hydrateConfig } from '@/core/store/config';
import { useLoading } from '@/core/store/loading';
import { ErrorBoundary as CustomErrorBoundary } from '@/core/utils/error-boundary';
import { setDefaultTimeZone } from '@/core/utils/moment';
import { setupExpoModulesErrorHandler } from '@/core/utils/safe-expo-modules';

import '@/ui/global.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useWatchResponse } from '~/src/core/hooks/useWatchResponse';
import { useAlertStore } from '~/src/core/store/alert-dialog';
import { useOtaUpdateReadyModal } from '~/src/core/store/ota-update-modal';
import AlertDialog from '../components/AlertDialog';
import { AppStateEffect } from '../components/AppStateEffect';
import { CallOverlay } from '../components/call/CallOverlay';
import FlashMessageWithMarkdown from '../components/FlashMessageWithMarkdown';
import NetworkStatus from '../components/NetWorkStatus';
import { OtaUpdateReadyModal } from '../components/OtaUpdateReadyModal';
import { UpdateDownloadModal } from '../components/UpdateDownloadModal';
import { useAppState } from '../core/hooks/useAppState';
import {
  cleanupSafeAppManagement,
  initializeSafeAppManagement,
} from '../core/utils/safe-app-management';
let Updates: any = null;

try {
  // OTA mismatch can make expo-updates native module unavailable at runtime.
  Updates = require('expo-updates');
} catch (error) {
  console.warn(
    '[RootLayout] expo-updates unavailable, disabling OTA UI',
    error,
  );
}

const useUpdatesSafe =
  Updates?.useUpdates ?? (() => ({ isUpdateAvailable: false }));

// ─── NotificationWrapper ───────────────────────────────────────────────────────
// Nhận isDoneCodepush từ Providers để không gọi useCodepush 2 lần
const NotificationWrapper = ({
  children,
  isDoneCodepush,
  onFetchUpdateAsync,
}: {
  children: React.ReactNode;
  isDoneCodepush: boolean;
  onFetchUpdateAsync: () => Promise<void>;
}) => {
  const { token } = usePushNotifications();
  const status = useAuth.use.status();
  const { isUpdateAvailable } = useUpdatesSafe();
  const appState = useAppState();
  const { mutate: setFCMRegistrationToken } = useSetFCMRegistrationToken();

  useEffect(() => {
    if (token && status === 'signIn') {
      setFCMRegistrationToken({ token });
    }
  }, [token, status]);

  useEffect(() => {
    // ANDROID ONLY: re-check OTA when the app returns to foreground.
    // On iOS this is intentionally DISABLED: surfacing the "Mở lại app" reload
    // modal while the order-list camera / vision-camera FrameProcessor is still
    // mounted lets the user trigger Updates.reloadAsync() under live worklet
    // jsi::Functions → worklets-core reload UAF crash (EXC_BAD_ACCESS). iOS still
    // checks OTA at startup via the root useCodepush() mount effect, so updates
    // are not lost — they simply apply on the next cold launch instead of
    // popping a mid-session reload. Android is unaffected by that crash class.
    if (Platform.OS !== 'android') return;
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
  initialRouteName: 'index',
};

hydrateAuth();
hydrateConfig();
setDefaultTimeZone();
SplashScreen.preventAutoHideAsync();

/** Check/tải update treo (mạng chập chờn) thì không giam app sau splash quá lâu. */
const SPLASH_MAX_WAIT_MS = 10_000;

/** Stable wrapper styles for @gorhom/portal — inline arrays/objects change every render and retrigger Portal's children effect → infinite update loop. */
const flashPortalStyles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999_999,
    elevation: 999_999,
  },
});

// ─── AuthWrapper ──────────────────────────────────────────────────────────────
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  useProtectedRoute();
  useHandleDeepLink();
  useWatchResponse();
  useStringeeCall();
  usePdaScan(); // lắng nghe quét mã từ máy PDA (Android), route tới màn đang focus
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
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen
          name="(drawer)"
          options={{ gestureEnabled: false, animation: 'none' }}
        />
        <Stack.Screen
          name="authorize"
          options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="login"
          options={{
            gestureEnabled: false,
            animation: 'none',
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="processing-slips" />
        <Stack.Screen name="support-center" />
        <Stack.Screen name="picker-shift-management" />
        <Stack.Screen name="employee-management" />
        <Stack.Screen name="telegram-group-management" />
        <Stack.Screen
          name="ota-gate"
          options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
        />
      </Stack>
    </Providers>
  );
}

// ─── Providers ────────────────────────────────────────────────────────────────
function Providers({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const status = useAuth.use.status();
  const loading = useLoading.use.loading();

  // ✅ CodePush chạy trước
  const { isDoneCodepush, onFetchUpdateAsync } = useCodepush();

  // Chặn GitHub check khi còn modal OTA / đang chờ reload
  const otaModalVisible = useOtaUpdateReadyModal((s) => s.visible);
  const otaPendingRestart = useOtaUpdateReadyModal((s) => s.pendingRestart);

  // ✅ GitHub auto-update chỉ chạy sau khi CodePush xong (đã apply / không còn OTA)
  const { progress, isDownloading } = useAutoUpdate({
    enabled: isDoneCodepush && !otaModalVisible && !otaPendingRestart,
  });

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  // Splash chỉ chờ CodePush (check/fetch OTA chạy ngầm dưới splash, không còn
  // màn Loading chặn). GitHub native check KHÔNG giữ splash: chạy tiếp sau khi
  // CodePush xong (sau reload nếu có OTA), cần update thì tự hiện alert chặn.
  // updateUiVisible: lỡ có alert/modal bật khi splash còn che thì hạ ngay.
  const alertVisible = useAlertStore((s) => s.alerts.length > 0);
  const waitingForUpdates = !isDoneCodepush;
  const updateUiVisible = isDownloading || alertVisible || otaModalVisible;

  useEffect(() => {
    if (status === 'idle') return;
    if (waitingForUpdates && !updateUiVisible) return;
    hideSplash();
  }, [status, waitingForUpdates, updateUiVisible, hideSplash]);

  // Failsafe: check update treo (mạng nghẽn, GitHub/OTA không phản hồi) →
  // vẫn hạ splash sau tối đa SPLASH_MAX_WAIT_MS để app dùng được.
  useEffect(() => {
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, SPLASH_MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setupExpoModulesErrorHandler();
    initializeSafeAppManagement();
    return () => {
      cleanupSafeAppManagement();
    };
  }, []);

  const flashMessageStyle = useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom, 8),
    }),
    [insets.bottom],
  );

  // Theo dõi toast đang hiển thị để bật lớp phủ "chạm ra ngoài để ẩn".
  const [isFlashVisible, setIsFlashVisible] = useState(false);
  const handleFlashShow = useCallback(() => setIsFlashVisible(true), []);
  const handleFlashHide = useCallback(() => setIsFlashVisible(false), []);
  const dismissFlash = useCallback(() => hideMessage(), []);

  // Giữ <FlashMessage> ổn định, không remount khi bật/tắt lớp phủ.
  const flashMessageEl = useMemo(
    () => (
      <FlashMessage
        position="bottom"
        duration={5000}
        style={flashMessageStyle}
        statusBarHeight={StatusBar.currentHeight}
        MessageComponent={FlashMessageWithMarkdown}
        onShow={handleFlashShow}
        onHide={handleFlashHide}
      />
    ),
    [flashMessageStyle, handleFlashShow, handleFlashHide],
  );

  const flashMessagePortal = useMemo(
    () => (
      <View pointerEvents="box-none" style={flashPortalStyles.wrap}>
        {/* Chạm ra ngoài toast để ẩn — chỉ mount khi đang có toast.
            Toast (zIndex 99) nằm trên nên vẫn nhận chạm riêng của nó. */}
        {isFlashVisible && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissFlash}
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo"
          />
        )}
        {flashMessageEl}
      </View>
    ),
    [isFlashVisible, flashMessageEl, dismissFlash],
  );

  return (
    <CustomErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error, errorInfo);
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PortalProvider>
          <APIProvider>
            {/* BottomSheetModal portal host phải nằm TRONG QueryClientProvider,
                nếu không hook trong sheet (vd useUploadImages) sẽ mất context. */}
            <BottomSheetModalProvider>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flex: 1 }}
                  pointerEvents={isDownloading ? 'none' : 'auto'}
                  collapsable={false}
                >
                  {/* Check/tải update chạy ngầm dưới splash, không còn màn
                      Loading chặn. NotificationWrapper vẫn tự blank khi đang
                      fetch OTA (lúc đó splash còn che); đang tải APK thì
                      pointerEvents='none' + UpdateDownloadModal lo phần UI. */}
                  <NotificationWrapper
                    isDoneCodepush={isDoneCodepush}
                    onFetchUpdateAsync={onFetchUpdateAsync}
                  >
                    <AuthWrapper>
                      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                        <NetworkStatus />
                        {loading && <Loading />}
                        {children}
                      </SafeAreaView>
                    </AuthWrapper>
                  </NotificationWrapper>
                </View>

                <AlertDialog />

                <CallOverlay />

                <OtaUpdateReadyModal />

                <AppStateEffect />

                <UpdateDownloadModal
                  visible={isDownloading}
                  progress={progress}
                />

                {/* Portal + zIndex/elevation: trên BottomSheet modal (@gorhom) */}
                <Portal>{flashMessagePortal}</Portal>
              </View>
            </BottomSheetModalProvider>
          </APIProvider>
        </PortalProvider>
      </GestureHandlerRootView>
    </CustomErrorBoundary>
  );
}
