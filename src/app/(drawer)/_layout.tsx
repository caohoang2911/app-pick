import { DrawerContent } from '@/components/DrawerContent';
import { Drawer } from 'expo-router/drawer';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { ConfigResponse, useGetConfig } from '~/src/api/config/useGetConfig';
import { useGetMyProfile } from '~/src/api/employee/use-get-my-profile';
import Loading from '~/src/components/Loading';
import { useAuth } from '~/src/core';
import { setConfig, useConfig } from '~/src/core/store/config';
import CrashlyticsService from '~/src/core/utils/crashlytics';
import { PortalProvider } from '@gorhom/portal';

const ConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isDone, setIsDone] = useState(false);
  const status = useAuth.use.status();
  const version = useConfig.use.version();
  const config = useConfig.use.config();
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

  const { data, refetch, isFetching } = useGetConfig({
    version: !isEmpty(config) ? version : '',
  });

  useEffect(() => {
    if (status === 'signIn') {
      refetch();
    }
  }, [status, config, isDone]);

  useEffect(() => {
    if (!isEmpty(config)) {
      setIsDone(true);
    }
  }, [config]);

  useEffect(() => {
    if (data?.error) return;
    if (data?.data) {
      setConfig(data.data as ConfigResponse);
    }
  }, [data]);

  if (isFetching || !isDone) {
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
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      />
    </ConfigWrapper>
  );
}
