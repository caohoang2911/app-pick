import { useEffect, useRef } from 'react';
import { useAuth } from '../store/auth';
import { useRouter, useSegments } from 'expo-router';
import { ROUTES } from '../constants/routes';
import { useOtaUpdateReadyModal } from '../store/ota-update-modal';

const AUTH_SEGMENTS = new Set(['login', 'internal-login', 'authorize']);

export function useProtectedRoute() {
  const status = useAuth.use.status();
  const segments = useSegments();
  const router = useRouter();
  const otaVisible = useOtaUpdateReadyModal((s) => s.visible);
  const otaPendingRestart = useOtaUpdateReadyModal((s) => s.pendingRestart);
  const hasCodepushUpdate = otaVisible || otaPendingRestart;

  const lastRedirectRef = useRef<{ target: string; at: number } | null>(null);

  useEffect(() => {
    if (status === 'idle') return;

    const segment = segments[0];
    if (segment === 'index') return;

    const safeRedirect = (target: string) => {
      const now = Date.now();
      if (
        lastRedirectRef.current?.target === target &&
        now - lastRedirectRef.current.at < 1200
      ) {
        return;
      }
      lastRedirectRef.current = { target, at: now };
      router.replace(target as any);
    };

    if (status === 'signOut') {
      if (AUTH_SEGMENTS.has(segment)) return;
      safeRedirect(ROUTES.AUTH.LOGIN);
      return;
    }

    if (status === 'signIn' && AUTH_SEGMENTS.has(segment)) {
      safeRedirect(hasCodepushUpdate ? ROUTES.APP.OTA_GATE : ROUTES.APP.ORDERS);
    }
  }, [hasCodepushUpdate, segments, router, status]);
}
