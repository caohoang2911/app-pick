import { useEffect, useRef } from 'react';
import { useAuth } from '../store/auth';
import { useRouter, useSegments } from 'expo-router';
import { ROUTES } from '../constants/routes';

export function useProtectedRoute() {
  const status = useAuth.use.status();
  const segments = useSegments();
  const router = useRouter();

  const firstTime = useRef(true);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'authorize';

    if (inAuthGroup) return;

    if (status === 'signOut') {
      router.navigate(ROUTES.AUTH.LOGIN as any);
    } else if (status === 'signIn' && firstTime.current) {
      firstTime.current = false;
      // Redirect away from the sign-in page.
      router.navigate(ROUTES.APP.ORDERS as any);
    }
  }, [segments, router, status]);
}
