import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Defs, Mask, Rect, Svg } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  type: 'qr' | 'codabar';
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
  type = 'qr',
}: Props) => {
  const { permission, facing, requestPermission } = useCarmera();

  const isQRScanner = type === 'qr';

  const handleRequestPermission = useCallback(() => {
    if(Platform.OS=='ios'){
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
        <View className="self-center mt-2">
          <Button onPress={handleRequestPermission} label="Yêu cầu truy cập" />
        </View>
      </View>
    );
  }

  return (
    <Portal>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={(result: BarcodeScanningResult) => {
          onDestroy?.();
          onSuccessBarcodeScanned?.(result);
        }}
        // barcodeScannerSettings={{
        //   barcodeTypes: ['qr', 'codabar', 'code128'],
        // }}
      >
        <ScannerLayout onClose={onDestroy} isQRScanner={isQRScanner} />
      </CameraView>
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
  },
});

export default ScannerBox;
