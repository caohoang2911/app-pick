import { CODEPUSH_VERSION } from '@/core/version';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const VersionDisplay = () => {
  const currentVersion = Constants.expoConfig?.version;
  return (
    <View style={styles.container}>
      <View className="flex gap-1">
        <Text
          style={styles.text}
        >{`Build ${Application.nativeBuildVersion ?? '—'}`}</Text>
        <Text style={styles.text}>{`Codepush ver: ${CODEPUSH_VERSION}`}</Text>
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
