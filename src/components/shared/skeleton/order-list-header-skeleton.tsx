import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

const OrderListHeaderSkeleton = () => {
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
    <View style={styles.container}>
      {/* Avatar + name + store + ca */}
      <View style={[styles.sb, { alignItems: 'flex-start', marginBottom: 12 }]}>
        <View style={[styles.row, { alignItems: 'flex-start' }]}>
          <B
            w={44}
            h={44}
            style={{ borderRadius: 22, flexShrink: 0, marginTop: 2 }}
          />
          <View style={{ gap: 7 }}>
            <View style={[styles.row, { gap: 6 }]}>
              <B w={155} h={16} />
              <B w={14} h={14} style={{ borderRadius: 7 }} />
            </View>
            <B w={205} h={26} style={{ borderRadius: 13 }} />
            <B w={125} h={13} />
          </View>
        </View>
        <B w={54} h={28} style={{ borderRadius: 14, flexShrink: 0 }} />
      </View>

      {/* Search + QR */}
      <View style={[styles.row, { marginBottom: 12 }]}>
        <B w="85%" h={44} style={{ borderRadius: 10 }} />
        <B w={44} h={44} style={{ borderRadius: 10 }} />
      </View>

      {/* Tab bar */}
      <View style={{ marginBottom: 12 }}>
        <View style={[styles.row, { gap: 10, marginBottom: 8 }]}>
          <B w={80} h={28} />
          <B w={80} h={28} />
          <B w={80} h={28} />
          <B w={80} h={28} />
          <B w={80} h={28} />
          <B w={80} h={28} />
        </View>
        <View style={styles.tabUnderline} />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {[90, 78, 84, 76, 80].map((w, i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: w,
                height: 28,
                borderRadius: 20,
                backgroundColor: '#E5E7EB',
              },
              animStyle,
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
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
  tabUnderline: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
  },
});

export default OrderListHeaderSkeleton;
