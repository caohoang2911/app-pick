import { useEffect, useRef } from 'react';
import { useAuth } from '../store/auth';
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
      router.navigate('/login');
    } else if (status === 'signIn' && firstTime.current) {
      firstTime.current = false;
      // Redirect away from the sign-in page.
      router.navigate('/orders');
    }
  }, [segments, router, status]);
}
