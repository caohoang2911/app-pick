import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { View } from 'react-native';
import { useLoading } from '../core/store/loading';

const Loading = ({
  description
}: {
  description?: string
}) => {
  const descriptionStore = useLoading.use.description();

  const shouldShowDescription = Boolean(descriptionStore) || Boolean(description);
  return (
    <>
      <View style={styles.loading}>
      </View>
      <View className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
        <View className='flex gap-2 items-center'>
          <View style={styles.box} className='w-12 h-12 rounded-lg'>
            <ActivityIndicator color="white" />
          </View>
          {Boolean(shouldShowDescription) && <Text>{descriptionStore || description}</Text>}
        </View>
      </View>
    </>
  )
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
    opacity: .3,
    backgroundColor: "gray",
    zIndex: 10,
  },
  box: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});