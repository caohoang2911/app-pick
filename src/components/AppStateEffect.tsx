import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { queryClient } from '../api/shared';
import { signOut, useAuth } from '../core';
import { useAppState } from '../core/hooks/useAppState';
import { isTimestampExpired } from '../core/utils/moment';

export const AppStateEffect = () => {
  const appState = useAppState();
  const { expired } = useAuth.use.userInfo();

  const isExpired = expired && isTimestampExpired(expired);
  const appStateRef = useRef<AppStateStatus>(appState);
  const backgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'background') {
        // Ghi lại thời điểm xuống background
        backgroundTimeRef.current = Date.now();
      }

      if (prevState === 'background' && nextAppState === 'active') {
        const elapsed = Date.now() - (backgroundTimeRef.current ?? 0);
        // Camera trigger thường < 1s, background thật thường > 2s
        if (elapsed > 2000) {
          queryClient.invalidateQueries({
            predicate: (q) => q.getObserversCount() > 0,
          });

          if (isExpired) {
            signOut();
          }
        } else {
          console.log('[AppState] ⏩ Skip — camera trigger');
        }
      }
    });

    return () => subscription.remove();
  }, [isExpired]);

  return null;
};
