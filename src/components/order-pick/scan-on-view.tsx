import { useQuery } from '@tanstack/react-query';
import { BarcodeScanningResult, CameraView } from 'expo-camera';
import { useGlobalSearchParams } from 'expo-router';
import { default as React, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Defs, Mask, Rect, Svg } from 'react-native-svg';
import useCarmera from '~/src/core/hooks/useCarmera';
import { OrderDetail } from '~/src/types/order-detail';

const deviceWidth = Dimensions.get('window').width;

const CAMERA_HEIGHT = 150;
const CAMERA_WIDTH = deviceWidth - 32;

const PADDING_HORIZONTAL = 20;
const PADDING_VERTICAL = 20;

const BORDER_RADIUS_CORNER = 0;
const CORNER_SIZE = 20;
const CORNER_HEIGHT = 1;

const Corner = () => (
  <>
    {/* top left */}
    <Rect
      x={PADDING_HORIZONTAL - +CORNER_HEIGHT}
      y={PADDING_VERTICAL + CORNER_HEIGHT}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={1}
      height={CORNER_SIZE}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />
    <Rect
      x={PADDING_HORIZONTAL - CORNER_HEIGHT}
      y={PADDING_VERTICAL + CORNER_HEIGHT}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_SIZE}
      height={CORNER_HEIGHT}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />

    {/* bottom left */}
    <Rect
      x={PADDING_HORIZONTAL}
      y={CAMERA_HEIGHT - PADDING_VERTICAL - CORNER_SIZE}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_HEIGHT}
      height={CORNER_SIZE}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />
    <Rect
      x={PADDING_HORIZONTAL}
      y={CAMERA_HEIGHT - PADDING_VERTICAL + CORNER_HEIGHT}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_SIZE}
      height={CORNER_HEIGHT}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />

    {/* bottom right */}
    <Rect
      x={CAMERA_WIDTH - PADDING_HORIZONTAL - CORNER_SIZE}
      y={CAMERA_HEIGHT - PADDING_VERTICAL}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_SIZE}
      height={CORNER_HEIGHT}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />
    <Rect
      x={CAMERA_WIDTH - PADDING_HORIZONTAL - CORNER_HEIGHT}
      y={CAMERA_HEIGHT - PADDING_VERTICAL - CORNER_SIZE + CORNER_HEIGHT}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_HEIGHT}
      height={CORNER_SIZE}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />

    {/* top left */}
    <Rect
      x={CAMERA_WIDTH - PADDING_HORIZONTAL - CORNER_HEIGHT}
      y={PADDING_VERTICAL}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_HEIGHT}
      height={CORNER_SIZE}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />
    <Rect
      x={CAMERA_WIDTH - PADDING_HORIZONTAL - CORNER_SIZE}
      y={PADDING_VERTICAL}
      rx={BORDER_RADIUS_CORNER}
      ry={BORDER_RADIUS_CORNER}
      width={CORNER_SIZE}
      height={CORNER_HEIGHT}
      stroke="white"
      strokeWidth="2.5"
      fill-opacity="0"
    />
  </>
);

const ScannerLayout = ({}: {}) => {
  return (
    <View style={styles.layout}>
      <Svg height="100%" width="100%">
        <Defs>
          <Mask id="mask" x="0" y="0" height="100%" width="100%">
            {/* <Rect height="100%" width="100%" fill="white" opacity={0.5} /> */}
            {/* <Rect
              x={10}
              y={10}
              width={CAMERA_WIDTH - 20}
              height={CAMERA_HEIGHT - 20}
              stroke="transparent"
              strokeWidth="0"
              fill-opacity="0"
            /> */}
            <Corner />
          </Mask>
        </Defs>
        <Rect height="100%" width="100%" mask="url(#mask)" fill="white" />
      </Svg>
    </View>
  );
};

const ScanOnView = ({
  onSuccessBarcodeScanned,
}: {
  onSuccessBarcodeScanned: (result: BarcodeScanningResult) => void;
}) => {
  const { permission, facing, requestPermission } = useCarmera();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View />;

  return (
    <View className="overflow-hidden mt-2 my-2" style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing={'back'}
        onBarcodeScanned={onSuccessBarcodeScanned}
      >
        <ScannerLayout />
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    height: CAMERA_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'red',
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  camera: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'red',
    zIndex: 999,
  },
  layout: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 3,
  },
});

export default ScanOnView;
