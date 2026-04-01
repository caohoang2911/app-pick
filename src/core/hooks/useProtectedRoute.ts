import { useEffect, useRef } from 'react';
import { useAuth } from '../store/auth';
import { useRouter, useSegments } from 'expo-router';
import { ROUTES } from '../constants/routes';

export function useProtectedRoute() {
  const status = useAuth.use.status();
  const segments = useSegments();
  const router = useRouter();

  const firstTime = useRef(true);
  const lastRedirectRef = useRef<{ target: string; at: number } | null>(null);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'authorize';

    if (inAuthGroup) return;

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
      safeRedirect(ROUTES.AUTH.LOGIN);
    } else if (status === 'signIn' && firstTime.current) {
      firstTime.current = false;
      // Redirect away from the sign-in page.
      safeRedirect(ROUTES.APP.ORDERS);
    }
  }, [segments, router, status]);
}
