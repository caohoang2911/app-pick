import { useAuth } from '@/core';
import { ROUTES } from '@/core/constants/routes';
import { useOtaUpdateReadyModal } from '@/core/store/ota-update-modal';
import { Redirect } from 'expo-router';

export default function Index() {
  const status = useAuth.use.status();
  const otaVisible = useOtaUpdateReadyModal((s) => s.visible);
  const otaPendingRestart = useOtaUpdateReadyModal((s) => s.pendingRestart);
  const hasCodepushUpdate = otaVisible || otaPendingRestart;

  if (status === 'idle') {
    return null;
  }

  if (status === 'signOut') {
    return <Redirect href={ROUTES.AUTH.LOGIN} />;
  }

  if (hasCodepushUpdate) {
    return <Redirect href={ROUTES.APP.OTA_GATE} />;
  }

  return <Redirect href={ROUTES.APP.ORDERS} />;
}
