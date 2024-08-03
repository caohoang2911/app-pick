/* eslint-disable react/react-in-jsx-scope */
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { NavigationContainer } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  SplashScreen,
  Stack,
  useNavigationContainerRef,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { Text } from 'react-native';

// import { APIProvider } from "@/api";
// import { hydrateAuth, loadSelectedTheme } from "@/core";
// import { useThemeConfig } from "@/core/use-theme-config";

export { ErrorBoundary } from 'expo-router';

// Import  global CSS file
import { hydrateAuth, useAuth } from '@/core';
import '@/ui/global.css';
import React, { useCallback, useEffect } from 'react';
import { APIProvider } from '../api/shared';
import Loading from '../components/Loading';

export const unstable_settings = {
  initialRouteName: 'login',
};

const prefix = Linking.createURL('/');

hydrateAuth();
SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const status = useAuth.use.status();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'authorize';

    if (inAuthGroup) return;

    if (status === 'signOut') {
      router.replace('/login');
    } else if ('signIn') {
      // Redirect away from the sign-in page.
      router.navigate('/orders');
    }
  }, [segments, router, status]);
}

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
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="authorize" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
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
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="dark" />
      <APIProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </APIProvider>
    </GestureHandlerRootView>
  );
}
