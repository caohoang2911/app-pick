import React from 'react';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet, Text } from 'react-native';

const Authorize = () => {
  return (
    <WebView style={styles.container} source={{ uri: 'https://expo.dev' }} />
  );
};

export default Authorize;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
