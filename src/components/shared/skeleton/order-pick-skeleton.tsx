import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ButtonBack from '@/components/ButtonBack';

const Bone = ({
  w,
  h,
  style,
  delay = 0,
  animStyle,
}: {
  w: number | `${number}%`;
  h: number;
  style?: object;
  delay?: number;
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

const ProductCardSkeleton = ({ animStyle }: { animStyle: any }) => (
  <View style={styles.card}>
    {/* Title row */}
    <View style={styles.sb}>
      <View style={{ flex: 1, gap: 6, marginRight: 8 }}>
        <Bone w="90%" h={15} animStyle={animStyle} />
        <Bone w="60%" h={15} animStyle={animStyle} />
      </View>
      <Bone w={16} h={16} style={{ borderRadius: 3 }} animStyle={animStyle} />
    </View>
    {/* Pills */}
    <View style={[styles.row, { marginBottom: 8 }]}>
      <Bone w={80} h={20} style={styles.pill} animStyle={animStyle} />
      <Bone w={56} h={20} style={styles.pill} animStyle={animStyle} />
    </View>
    {/* Image + info */}
    <View style={styles.row}>
      <Bone w={90} h={90} style={{ borderRadius: 8 }} animStyle={animStyle} />
      <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
        {[
          ['50%', '20%', '25%'],
          ['50%', '20%', '25%'],
          ['50%', '20%', '25%'],
        ].map((cols, i) => (
          <View key={i} style={styles.sb}>
            {cols.map((w, j) => (
              <Bone key={j} w={w as any} h={13} animStyle={animStyle} />
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Bone w={64} h={20} style={styles.pill} animStyle={animStyle} />
          <Bone w={44} h={20} style={styles.pill} animStyle={animStyle} />
        </View>
      </View>
    </View>
  </View>
);

const OrderPickSkeleton = ({ code }: { code: string }) => {
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

  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      {/* Header picker */}
      <View style={[styles.sb, {}]}>
        <View style={styles.row}>
          {/* <Bone
            w={16}
            h={16}
            style={{ borderRadius: 3 }}
            animStyle={animStyle}
          /> */}
          <ButtonBack
            title={<Text className="text-base font-semibold">{code}</Text>}
          />
          {/* <Bone w={180} h={14} animStyle={animStyle} /> */}
        </View>
        <Bone w={60} h={13} animStyle={animStyle} />
      </View>

      {/* Barcode input */}
      <View style={[styles.row, { marginBottom: 12 }]}>
        <Bone
          w="85%"
          h={40}
          style={{ borderRadius: 8 }}
          animStyle={animStyle}
        />
        <Bone w={40} h={40} style={{ borderRadius: 8 }} animStyle={animStyle} />
      </View>

      {/* Section label */}
      {/* <View style={styles.sectionLabel}>
        <Bone w={160} h={14} style={{ backgroundColor: '#F5C97A55' }} animStyle={animStyle} />
      </View> */}

      {/* Product cards */}
      <ProductCardSkeleton animStyle={animStyle} />
      <ProductCardSkeleton animStyle={animStyle} />
      <ProductCardSkeleton animStyle={animStyle} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 8,
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
  sectionLabel: {
    backgroundColor: '#FFF8EC',
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
});

export default OrderPickSkeleton;
