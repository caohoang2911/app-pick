import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const Bone = ({
  w,
  h,
  style,
  animStyle,
}: {
  w: number | `${number}%`;
  h: number;
  style?: object;
  animStyle: any;
}) => (
  <Animated.View
    style={[
      { width: w, height: h, borderRadius: 4, backgroundColor: '#E5E7EB' },
      animStyle,
      style,
    ]}
  />
);

const OrderInvoiceSkeleton = () => {
  const shimmer = useSharedValue(1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));
  const B = (props: Omit<Parameters<typeof Bone>[0], 'animStyle'>) => (
    <Bone {...props} animStyle={animStyle} />
  );

  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      {/* Header title */}
      <View style={[styles.sb, { marginBottom: 6 }]}>
        <View style={styles.row}>
          <B w={12} h={12} style={{ borderRadius: 2 }} />
          <B w={110} h={18} />
        </View>
        <View style={styles.row}>
          <B w={110} h={13} />
          <B w={16} h={16} style={{ borderRadius: 3 }} />
        </View>
      </View>

      {/* Pills */}
      <View style={[styles.row, { marginBottom: 14 }]}>
        <B w={56} h={22} style={styles.pill} />
        <B w={64} h={22} style={styles.pill} />
        <B w={88} h={22} style={styles.pill} />
      </View>

      {/* Info card */}
      <View style={styles.card}>
        {[
          [70, 40],
          [70, 110],
          [55, 140],
          [50, 160],
        ].map(([labelW, valueW], i) => (
          <View key={i} style={styles.infoRow}>
            <B w={labelW} h={13} />
            <B w={valueW} h={13} />
          </View>
        ))}
        {/* Address — 2 lines */}
        <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
          <B w={80} h={13} />
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <B w={180} h={13} />
            <B w={140} h={13} />
          </View>
        </View>
      </View>

      {/* Shipping card */}
      <View style={styles.card}>
        <B w={80} h={15} style={{ marginBottom: 14 }} />
        {[
          [65, 20],
          [50, 140],
          [40, 20],
        ].map(([labelW, valueW], i) => (
          <View key={i} style={styles.infoRow}>
            <B w={labelW} h={13} />
            <B w={valueW} h={13} />
          </View>
        ))}
      </View>

      {/* Product list card */}
      <View style={styles.card}>
        {[
          { imgRounded: false, titleW: '85%', codeW: 100 },
          { imgRounded: true, titleW: '75%', codeW: 55 },
          { imgRounded: false, titleW: '55%', codeW: 55 },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              styles.productRow,
              i === 2 && { borderBottomWidth: 0, paddingBottom: 0 },
              i === 0 && { paddingTop: 0 },
            ]}
          >
            <B
              w={64}
              h={64}
              style={{ borderRadius: item.imgRounded ? 32 : 8, flexShrink: 0 }}
            />
            <View style={{ flex: 1, gap: 7 }}>
              <B w={item.titleW as any} h={14} />
              <View style={styles.sb}>
                <B w={item.codeW} h={12} />
                <B w={40} h={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
});

export default OrderInvoiceSkeleton;
