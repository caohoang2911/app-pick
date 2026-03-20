import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ScanBagsSkeleton = () => {
  const shimmer = useSharedValue(1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  const Bone = ({
    w,
    h,
    style,
  }: {
    w: number | string;
    h: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: 4,
          backgroundColor: '#E5E7EB',
        },
        animStyle,
        style,
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Card thông tin đơn */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Bone w={120} h={18} />
          <Bone w={100} h={14} />
        </View>
        <View style={styles.pillRow}>
          <Bone w={56} h={22} style={styles.pill} />
          <Bone w={64} h={22} style={styles.pill} />
          <Bone w={80} h={22} style={styles.pill} />
        </View>
        <View style={styles.divider} />
        {(
          [
            [40, 30],
            [70, 110],
            [30, 100],
            [55, 140],
            [70, 180],
          ] as [number, number][]
        ).map(([labelW, valueW], i) => (
          <View key={i} style={[styles.row, { marginBottom: 10 }]}>
            <Bone w={labelW} h={13} />
            <Bone w={valueW} h={13} />
          </View>
        ))}
      </View>

      {/* Card túi hàng */}
      <View style={styles.card}>
        <View
          style={[styles.row, { justifyContent: 'flex-end', marginBottom: 14 }]}
        >
          <Bone w={80} h={13} />
        </View>

        {(
          [
            { labelW: 70, count: 1 },
            { labelW: 90, count: 1 },
            { labelW: 80, count: 2 },
          ] as { labelW: number; count: number }[]
        ).map((section, i) => (
          <View key={i}>
            <View style={styles.sectionHeader}>
              <Bone w={section.labelW} h={15} />
              <Bone w={36} h={13} />
            </View>
            {Array(section.count)
              .fill(0)
              .map((_, j) => (
                <View key={j} style={styles.bagRow}>
                  <Bone w={135} h={13} />
                  <Bone w={20} h={20} style={styles.circle} />
                </View>
              ))}
          </View>
        ))}
      </View>

      {/* Button */}
      <Bone w="100%" h={48} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    borderRadius: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 2,
  },
  bagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  circle: {
    borderRadius: 10,
  },
  button: {
    borderRadius: 12,
    marginTop: 16,
  },
});

export default ScanBagsSkeleton;
