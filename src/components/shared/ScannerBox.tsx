import AntDesign from '@expo/vector-icons/AntDesign';
import { Portal } from '@gorhom/portal';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Dimensions, Linking, Platform, Pressable, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Defs, Mask, Rect, Svg } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { Button } from '../Button';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

type Props = {
  visible?: boolean;
  onDestroy?: () => void;
  onSuccessBarcodeScanned?: (result: BarcodeScanningResult) => void;
  types: BarcodeType[];
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

  const [zoom, setZoom] = useState(0);
  const animatedZoom = useRef(new Animated.Value(0)).current;
  const pinchRef = useRef(null);
  const baseScale = useRef(1);
  const pinchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setZoom(0);
      animatedZoom.setValue(0);
      baseScale.current = 1;
      pinchScale.setValue(1);
    }
  }, [visible]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.05, 1);
    animateZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.05, 0);
    animateZoom(newZoom);
  };

  const animateZoom = (targetZoom: number) => {
    setZoom(targetZoom);
    
    Animated.timing(animatedZoom, {
      toValue: targetZoom,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const listener = animatedZoom.addListener(({ value }) => {
      // Nếu camera có API trực tiếp để set zoom (không phải qua props)
      // cameraRef.current?.setZoom(value);
    });
    
    return () => {
      animatedZoom.removeListener(listener);
    };
  }, []);

  const handleRequestPermission = useCallback(() => {
    if(Platform.OS=='ios' && permission?.granted){
      Linking.openURL('app-settings:')
    } else {
      requestPermission();
    }
  }, []);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: false }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const currentScale = event.nativeEvent.scale;
      baseScale.current *= currentScale;
      
      const normalizedZoom = Math.min(Math.max((baseScale.current - 1) / 2, 0), 1);
      animateZoom(normalizedZoom);
      
      pinchScale.setValue(1);
    }
  };

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
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={onPinchStateChange}
      >
        <Animated.View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
          <CameraView
            style={[styles.camera, { display: visible ? 'flex' : 'none' }]}
            facing={facing}
            zoom={zoom}
            onBarcodeScanned={(result: BarcodeScanningResult) => {
              onDestroy?.();
              onSuccessBarcodeScanned?.(result);
            }}
          >
            <ScannerLayout onClose={onDestroy} isQRScanner={isQRScanner} />
            <View style={styles.controls}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
                <AntDesign name="minuscircleo" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
                <AntDesign name="pluscircleo" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.zoomIndicator}>
              <Animated.View 
                style={[
                  styles.zoomIndicatorFill, 
                  { 
                    width: animatedZoom.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
            </View>
            <Animated.Text style={styles.zoomValue}>
              {animatedZoom.interpolate({
                inputRange: [0, 1],
                outputRange: ['1x', '3x'],
                extrapolate: 'clamp'
              })}
            </Animated.Text>
          </CameraView>
        </Animated.View>
      </PinchGestureHandler>
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
  controls: {
    position: 'absolute',
    zIndex: 13,
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  controlButton: {
    padding: 10,
    zIndex: 3,
  },
  controlText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 120,
    left: 30,
    right: 30,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  zoomIndicatorFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  zoomValue: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
});

export default React.memo(ScannerBox);
