import { useEffect, useRef } from 'react';
import { useAuth } from '../auth';
import { useRouter, useSegments } from 'expo-router';

export function useProtectedRoute() {
  const status = useAuth.use.status();
  const segments = useSegments();
  const router = useRouter();

  const firstTime = useRef(true);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'authorize';

    if (inAuthGroup) return;

    if (status === 'signOut') {
      router.replace('/login');
    } else if ('signIn' && firstTime.current) {
      firstTime.current = false;
      // Redirect away from the sign-in page.
      router.navigate('/orders');
    }
  }, [segments, router, status]);
}
