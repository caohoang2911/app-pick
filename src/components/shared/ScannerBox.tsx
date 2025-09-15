import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from "react-native-svg";
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';

const codeAvailable = ['aztec', 'ean13', 'ean8', 'qr', 'pdf417', 'upc_e', 'datamatrix', 'code39', 'code93', 'itf14', 'codabar', 'code128', 'upc_a'];

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  types?: BarcodeType[];
};

const deviceWidth = Dimensions.get('screen').width;
const deviceHeight = Dimensions.get('screen').height;

const SCAN_SQUARE_SIZE = deviceWidth - 150;

const ScannerLayout = ({
  onClose,
  isQRScanner,
}: {
  onClose: any;
  isQRScanner?: boolean;
}) => {
  const holeWidth = SCAN_SQUARE_SIZE;
  const holeHeight = SCAN_SQUARE_SIZE / (isQRScanner ? 1 : 2);
  const holeX = deviceWidth / 2 - holeWidth / 2;
  const holeY = deviceHeight / 2 - holeHeight / 2;
  return (
    <View style={styles.layout}>
      <Svg height="100%" width="100%">
      <Defs>
        <ClipPath id="clip">
          {/* phủ toàn màn hình */}
          <Rect width="100%" height="100%" />
          {/* lỗ quét */}
          <Rect x={holeX} y={holeY} width={holeWidth} height={holeHeight} />
        </ClipPath>
      </Defs>

      {/* overlay */}
      <Rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.6)"
        clipPath="url(#clip)"
      />

      {/* viền trắng quanh lỗ */}
      <Rect
        x={holeX}
        y={holeY}
        width={holeWidth}
        height={holeHeight}
        stroke="white"
        strokeWidth={3}
        fill="transparent"
      />
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

  const codeAvailableForScanner = useMemo(() => {
    if(isQRScanner) {
      return ['qr'];
    }

    return codeAvailable.filter((type) => type !== 'qr');
  }, [isQRScanner]);

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
      <View style={styles.fullScreenContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={(result: BarcodeScanningResult) => {
            onDestroy?.();
            setTimeout(() => {
              onSuccessBarcodeScanned?.(result);
            }, 100);
          }}
          barcodeScannerSettings={{
            barcodeTypes: codeAvailableForScanner as BarcodeType[],
          }}
        >
          <ScannerLayout onClose={onDestroy} isQRScanner={isQRScanner} />
        </CameraView>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
  },
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
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    zIndex: 15,
  }
});

export default React.memo(ScannerBox);
