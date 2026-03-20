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

const OrderCardSkeleton = ({
  animStyle,
  hasWarning = false,
}: {
  animStyle: any;
  hasWarning?: boolean;
}) => {
  const B = (p: Omit<Parameters<typeof Bone>[0], 'animStyle'>) => (
    <Bone {...p} animStyle={animStyle} />
  );

  return (
    <View style={styles.card}>
      <View style={[styles.sb, styles.cardHeader]}>
        <B w={100} h={16} />
        <View style={styles.row}>
          <B w={115} h={13} />
          <B w={16} h={16} style={{ borderRadius: 3 }} />
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Customer + amount */}
        <View style={styles.infoRow}>
          <B w={20} h={20} style={{ borderRadius: 10, flexShrink: 0 }} />
          <B w={130} h={15} />
          <B w={130} h={13} style={{ marginLeft: 'auto' }} />
        </View>

        {/* ĐC giao */}
        <View style={styles.infoRow}>
          <B w={18} h={18} style={{ borderRadius: 3, flexShrink: 0 }} />
          <B w={80} h={13} />
          <B w={170} h={13} />
        </View>

        {/* Ngày đặt */}
        <View style={styles.infoRow}>
          <B w={18} h={18} style={{ borderRadius: 3, flexShrink: 0 }} />
          <B w={58} h={13} />
          <B w={90} h={13} />
        </View>

        {/* Ngày giao */}
        <View style={styles.infoRow}>
          <B w={18} h={18} style={{ borderRadius: 3, flexShrink: 0 }} />
          <B w={58} h={13} />
          <B w={160} h={13} />
        </View>

        {/* NV Pick */}
        <View style={[styles.infoRow, { marginBottom: 14 }]}>
          <B w={18} h={18} style={{ borderRadius: 3, flexShrink: 0 }} />
          <B w={52} h={13} />
          {hasWarning ? (
            <B w={170} h={34} style={{ borderRadius: 8 }} />
          ) : (
            <B w={110} h={13} />
          )}
        </View>

        <View style={styles.row}>
          <B w={58} h={24} style={styles.pill} />
          <B w={90} h={24} style={styles.pill} />
        </View>
      </View>
    </View>
  );
};

const OrderListSkeleton = () => {
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
  const B = (p: Omit<Parameters<typeof Bone>[0], 'animStyle'>) => (
    <Bone {...p} animStyle={animStyle} />
  );

  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      <OrderCardSkeleton animStyle={animStyle} />
      <OrderCardSkeleton animStyle={animStyle} hasWarning />
      <OrderCardSkeleton animStyle={animStyle} hasWarning />
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
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  cardBody: {
    padding: 14,
    paddingHorizontal: 16,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tabUnderline: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    marginBottom: 10,
  },
});

export default OrderListSkeleton;
