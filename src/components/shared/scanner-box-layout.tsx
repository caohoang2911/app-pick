import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';
import type { ScanRegion } from '~/src/types/scanner';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('screen');

export type ScannerLayoutProps = {
  onClose: () => void;
  isQRScanner?: boolean;
  onToggleScanner?: () => void;
  scanRegion: ScanRegion;
};

const ScannerLayout = React.memo(
  ({
    onClose,
    isQRScanner,
    onToggleScanner,
    scanRegion,
  }: ScannerLayoutProps) => {
    const {
      x: holeX,
      y: holeY,
      width: holeWidth,
      height: holeHeight,
    } = scanRegion;
    const clipPathId = isQRScanner ? 'clip-qr' : 'clip-barcode';

    return (
      <View style={styles.layout}>
        <Svg height="100%" width="100%">
          <Defs>
            <ClipPath id={clipPathId}>
              <Rect width="100%" height="100%" />
              <Rect x={holeX} y={holeY} width={holeWidth} height={holeHeight} />
            </ClipPath>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            clipPath={`url(#${clipPathId})`}
          />
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

        <View
          style={[
            styles.currentScannerTextContainer,
            { top: holeY + holeHeight + 10 },
          ]}
        >
          <Text style={styles.currentScannerText}>
            {isQRScanner ? 'QR Code' : 'Barcode'}
          </Text>
        </View>

        <View className="ml-auto absolute top-14 right-5 z-10">
          <Pressable onPress={onClose} hitSlop={15}>
            <AntDesign name="closecircleo" size={20} color="white" />
          </Pressable>
        </View>

        <View className="absolute left-1/2 -translate-x-1/2 bottom-14 z-10">
          <Pressable onPress={onToggleScanner} style={styles.toggleButton}>
            <View style={styles.toggleButtonContent}>
              <Ionicons name="swap-horizontal" size={16} color="white" />
              <Text style={styles.toggleButtonText}>
                {isQRScanner ? 'Chuyển sang Barcode' : 'Chuyển sang QR Code'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  },
);

ScannerLayout.displayName = 'ScannerLayout';

const styles = StyleSheet.create({
  layout: {
    position: 'absolute',
    width: deviceWidth,
    height: deviceHeight,
    backgroundColor: 'transparent',
    zIndex: 15,
  },
  toggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentScannerTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  currentScannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default ScannerLayout;
