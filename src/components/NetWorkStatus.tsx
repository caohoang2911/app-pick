import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { queryClient } from '../api/shared';

/** Tránh banner nhấp nháy khi API mạng báo dao động lúc mở app / Wi‑Fi không internet. */
const OFFLINE_DEBOUNCE_MS = 600;

const NetworkStatus = () => {
  /** null = chưa biết (không hiện banner để tránh flash sai). */
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const prevOnlineRef = useRef<boolean | null>(null);
  const offlineDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearOfflineDebounce = () => {
      if (offlineDebounceRef.current) {
        clearTimeout(offlineDebounceRef.current);
        offlineDebounceRef.current = null;
      }
    };

    const applyNetworkState = (rawConnected: boolean | null | undefined) => {
      const online = rawConnected === true;

      if (online) {
        clearOfflineDebounce();
        const wasOffline = prevOnlineRef.current === false;
        if (wasOffline) {
          queryClient.refetchQueries({ type: 'active' });
        }
        prevOnlineRef.current = true;
        setIsOnline(true);
        return;
      }

      clearOfflineDebounce();
      offlineDebounceRef.current = setTimeout(() => {
        offlineDebounceRef.current = null;
        prevOnlineRef.current = false;
        setIsOnline(false);
      }, OFFLINE_DEBOUNCE_MS);
    };

    const run = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        applyNetworkState(state.isConnected);
      } catch {
        applyNetworkState(false);
      }
    };

    void run();

    const intervalId = setInterval(run, 12_000);

    return () => {
      clearOfflineDebounce();
      clearInterval(intervalId);
    };
  }, []);

  if (isOnline !== false) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mất kết nối mạng</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    color: 'white',
  },
});

export default NetworkStatus;
