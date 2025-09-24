import { CameraView } from 'expo-camera';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * CameraPreloader component để preload camera trong background
 * Giúp tăng tốc độ khởi động camera khi cần sử dụng
 */
const CameraPreloader = () => {
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Preload camera khi component mount
    // Component này sẽ được render ẩn để preload camera
    return () => {
      // Cleanup khi component unmount
    };
  }, []);

  return (
    <View style={styles.hiddenContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.hiddenCamera}
        facing="back"
        // Không cần barcode scanner settings cho preloader
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, // Đặt ngoài màn hình
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
    zIndex: -1,
  },
  hiddenCamera: {
    width: 1,
    height: 1,
  },
});

export default React.memo(CameraPreloader);
