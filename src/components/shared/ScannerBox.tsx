import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Dimensions, Linking, Platform, Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { Defs, Mask, Rect, Svg } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  types?: BarcodeType[];
};

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

const SCAN_SQUARE_SIZE = deviceWidth - 150;

const ScannerLayout = ({
  onClose,
  isQRScanner,
}: {
  onClose: any;
  isQRScanner?: boolean;
}) => {
  return (
    <View style={styles.layout}>
      <Svg height="100%" width="100%">
        <Defs>
          <Mask id="mask" x="0" y="0" height="100%" width="100%">
            <Rect height="100%" width="100%" fill="white" opacity={0.5} />
            <Rect
              x={deviceWidth / 2 - SCAN_SQUARE_SIZE / 2}
              y={deviceHeight / 2 - SCAN_SQUARE_SIZE / 2}
              // rx="5"
              // ry="5"
              width={SCAN_SQUARE_SIZE}
              height={SCAN_SQUARE_SIZE / (isQRScanner ? 1 : 2)}
              stroke="white"
              strokeWidth="3"
              fill-opacity="0"
            />
          </Mask>
        </Defs>
        <Rect height="100%" width="100%" mask="url(#mask)" fill="white" />
      </Svg>
      <View className="ml-auto absolute top-14 right-5 z-10">
        <Pressable onPress={onClose}>
          <AntDesign name="closecircleo" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

const ScannerBox = ({
  visible,
  onDestroy,
  onSuccessBarcodeScanned,
  types,
}: Props) => {
  const { permission, facing, requestPermission }  = useCarmera();

  const isQRScanner = types?.includes('qr');

  useEffect(() => {
    // Reset state when visibility changes
  }, [visible]);

  const handleRequestPermission = useCallback(() => {
    if(Platform.OS=='ios' && permission?.granted){
      Linking.openURL('app-settings:')
    } else {
      requestPermission();
    }
  }, []);

  if (!visible) return <></>;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container} className="px-4">
        <Text className="text-center">
          Bạn không có quyền truy cập vào camera
        </Text>
        <View className="self-center flex-row justify-center mt-4 gap-3">
          <Button onPress={onDestroy} variant="secondary" label="Trở lại" />
          <Button onPress={handleRequestPermission} label="Yêu cầu truy cập" />
        </View>
      </View>
    );
  }

  return (
    <Portal>
      <Animated.View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        <CameraView
          style={[styles.camera, { display: visible ? 'flex' : 'none' }]}
          facing={facing}
          onBarcodeScanned={(result: BarcodeScanningResult) => {
            onDestroy?.();
            setTimeout(() => {
              onSuccessBarcodeScanned?.(result);
            }, 100);
          }}
        >
          <ScannerLayout onClose={onDestroy} isQRScanner={isQRScanner} />
        </CameraView>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 10,
    position: 'absolute',
    backgroundColor: 'white',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  camera: {
    flex: 1,
    height: '100%',
    backgroundColor: 'red',
    zIndex: 10,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  layout: {
    position: 'absolute',
    width: deviceWidth,
    height: deviceHeight,
    zIndex: 3,
  }
});

export default React.memo(ScannerBox);
