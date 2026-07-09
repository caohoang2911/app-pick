import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Images } from '~/assets';

const DOT_COUNT = 3;
/** Nhịp lệch pha giữa các chấm để tạo hiệu ứng sóng. */
const DOT_STAGGER_MS = 160;

const Dot = ({ index }: { index: number }) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * DOT_STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 320 }),
        ),
        -1,
      ),
    );
  }, [index, offset]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
};

type Props = {
  title?: string;
  subtitle?: string;
};

/** Màn che toàn màn hình khi WebView đã điều hướng qua seedcom.vn — giấu UI web trong lúc chờ bắt event login. */
const AuthorizeLoadingOverlay = ({
  title = 'Đang đăng nhập',
  subtitle = 'Vui lòng đợi trong giây lát...',
}: Props) => {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [breathe]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={Images.logo}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <View style={styles.dots}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <Dot key={index} index={index} />
        ))}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 170,
    height: 40,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  title: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
});

export default AuthorizeLoadingOverlay;
