import React, { version } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CODEPUSH_VERSION } from '@/core/version';
import { useConfig } from '@/core/store/config';
import Constants from 'expo-constants';

export const VersionDisplay = () => {
  const currentVersion = Constants.expoConfig?.version;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`Codepush ver: ${CODEPUSH_VERSION}`}</Text>
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
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  text: {
    color: '#888888',
    fontSize: 12,
  },
}); 