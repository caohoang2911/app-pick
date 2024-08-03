import { useEffect } from 'react';
import { useAuth } from '../auth';
import { useRouter } from 'expo-router';

export function useProtectedRoute() {
  const status = useAuth.use.status();

  // const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signOut') {
      router.replace('/login');
    } else if ('signIn') {
      // Redirect away from the sign-in page.
      router.replace('/order');
    }
  }, [router, status]);
}
