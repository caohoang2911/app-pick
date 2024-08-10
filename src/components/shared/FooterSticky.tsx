import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import {
  AvoidSoftInput,
  useSoftInputHeightChanged,
} from 'react-native-avoid-softinput';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '../Button';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const NOOP = () => {};
const FooterSticky = ({ children, footer = <></> }: Props) => {
  const buttonContainerPaddingValue = useSharedValue(0);

  const buttonContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: buttonContainerPaddingValue.value,
    };
  });

  const onFocusEffect = React.useCallback(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(true);

    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useFocusEffect(onFocusEffect);

  useSoftInputHeightChanged(({ softInputHeight }) => {
    buttonContainerPaddingValue.value = withTiming(softInputHeight);
  });

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
      <View style={styles.scrollWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          contentInsetAdjustmentBehavior="always"
        >
          {children}
        </ScrollView>
      </View>
      <Animated.View
        style={[buttonContainerAnimatedStyle, styles.ctaButtonWrapper]}
      >
        <View style={styles.ctaButtonContainer}>{footer}</View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default FooterSticky;

const styles = StyleSheet.create({
  ctaButtonContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
  },
  ctaButtonWrapper: {
    alignSelf: 'stretch',
  },
  scrollContainer: {
    paddingHorizontal: 12,
  },
  scrollWrapper: {
    alignSelf: 'stretch',
    flex: 1,
  },
});
