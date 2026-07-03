import { DrawerContent } from '@/components/DrawerContent';
import { PortalProvider } from '@gorhom/portal';
import { Drawer } from 'expo-router/drawer';
import { useEffect } from 'react';
import { useGetConfig } from '~/src/api/config/use-get-config';
import { useGetMyProfile } from '~/src/api/employee/use-get-my-profile';
import Loading from '~/src/components/Loading';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import CrashlyticsService from '~/src/core/utils/crashlytics';

const ConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const status = useAuth.use.status();
  const version = useConfig.use.version();
  const userInfo = useAuth.use.userInfo();

  useGetMyProfile();

  // Set Crashlytics user info when signed in
  useEffect(() => {
    if (status === 'signIn' && userInfo) {
      const userId =
        (userInfo as any).employeeId || userInfo.storeCode || 'unknown';
      CrashlyticsService.setUserId(String(userId));

      if (userInfo.storeCode) {
        CrashlyticsService.setAttribute('storeCode', userInfo.storeCode);
      }
      if (userInfo.storeName) {
        CrashlyticsService.setAttribute('storeName', userInfo.storeName);
      }
    }
  }, [status, userInfo]);

  const { refetch, isLoading: isLoadingGetConfig } = useGetConfig({
    localVersion: version,
  });

  useEffect(() => {
    if (status === 'signIn' && version) {
      refetch();
    }
  }, [status, version, refetch]);

  if (!version && isLoadingGetConfig) {
    return (
      <PortalProvider>
        <Loading />
      </PortalProvider>
    );
  }

  // Không render gì nếu chưa đăng nhập
  if (status === 'signOut') {
    return null;
  }

  return children;
};

export default function DrawerLayout() {
  return (
    <ConfigWrapper>
      <Drawer
        initialRouteName="orders"
        screenOptions={{
          headerShown: false,
          drawerStyle: { width: '75%' },
          swipeEdgeWidth: 0,
          swipeEnabled: false,
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      />
    </ConfigWrapper>
  );
}
