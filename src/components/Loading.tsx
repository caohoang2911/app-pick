import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useLoading } from '../core/store/loading';

const Loading = ({ description }: { description?: string }) => {
  const descriptionStore = useLoading.use.description();

  const shouldShowDescription =
    Boolean(descriptionStore) || Boolean(description);
  return (
    <Portal>
      <View style={styles.root}>
        <View style={styles.backdrop} />
        <View style={styles.center}>
          <View style={styles.box}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
          {shouldShowDescription && (
            <Text style={styles.description}>
              {descriptionStore || description}
            </Text>
          )}
        </View>
      </View>
    </Portal>
  );
};

export default Loading;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  box: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    color: '#fff',
    textAlign: 'center',
  },
});
