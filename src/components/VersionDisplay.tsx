import { CODEPUSH_VERSION } from '@/core/version';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const getRuntimeVersion = (): string => {
  try {
    // Prefer native expo-updates value (khớp binary đang chạy).
    const Updates = require('expo-updates');
    if (typeof Updates?.runtimeVersion === 'string' && Updates.runtimeVersion) {
      return Updates.runtimeVersion;
    }
  } catch {
    // OTA/native mismatch có thể làm module unavailable.
  }

  const fromConfig = Constants.expoConfig?.runtimeVersion;
  if (typeof fromConfig === 'string') return fromConfig;
  return '—';
};

export const VersionDisplay = () => {
  const currentVersion = Constants.expoConfig?.version;
  const runtimeVersion = getRuntimeVersion();
  return (
    <View style={styles.container}>
      <View className="flex gap-1">
        <Text
          style={styles.text}
        >{`Build ${Application.nativeBuildVersion ?? '—'}`}</Text>
        <Text style={styles.text}>{`Codepush ver: ${CODEPUSH_VERSION}`}</Text>
        <Text style={styles.text}>{`Runtime ver: ${runtimeVersion}`}</Text>
      </View>
      <Text style={styles.text}>{`App ver: ${currentVersion}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  text: {
    color: '#888888',
    fontSize: 12,
  },
});
