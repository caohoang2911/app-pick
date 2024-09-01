import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

const Loading = () => {
  return <ActivityIndicator className="flex-1" style={styles.loading} />;
};

export default Loading;

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  }
});