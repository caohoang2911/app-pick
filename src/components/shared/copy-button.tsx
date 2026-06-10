import { Portal } from '@gorhom/portal';
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Clipboard, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { colors } from '~/src/ui/colors';

const RESET_DELAY_MS = 1500;
const TOOLTIP_WIDTH = 60;
const CARET_SIZE = 5;
const TOOLTIP_HEIGHT = 18;
const TOOLTIP_GAP = 2;

type TooltipLayout = {
  x: number;
  y: number;
  width: number;
};

type Props = {
  value: string;
  size?: number;
};

const CopyButton = ({ value, size = 16 }: Props) => {
  const [copied, setCopied] = useState(false);
  const [tooltipLayout, setTooltipLayout] = useState<TooltipLayout | null>(
    null,
  );
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const buttonRef = useRef<View>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(() => {
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toastOpacity]);

  const handleCopy = useCallback(() => {
    if (!value) return;

    Clipboard.setString(value);
    buttonRef.current?.measureInWindow((x, y, width) => {
      setTooltipLayout({ x, y, width });
    });
    setCopied(true);
    showToast();

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
      setTooltipLayout(null);
    }, RESET_DELAY_MS);
  }, [value, showToast]);

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity onPress={handleCopy} hitSlop={8} activeOpacity={0.7}>
          <Feather
            name={copied ? 'check' : 'copy'}
            size={size}
            color={colors.colorPrimary}
          />
        </TouchableOpacity>
      </View>
      {copied && tooltipLayout && (
        <Portal>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
              style={{
                opacity: toastOpacity,
                position: 'absolute',
                top:
                  tooltipLayout.y - TOOLTIP_GAP - CARET_SIZE - TOOLTIP_HEIGHT,
                left:
                  tooltipLayout.x + tooltipLayout.width / 2 - TOOLTIP_WIDTH / 2,
                width: TOOLTIP_WIDTH,
                alignItems: 'center',
                zIndex: 9999,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.contentPrimary,
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 11 }}>Đã copy</Text>
              </View>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: CARET_SIZE,
                  borderRightWidth: CARET_SIZE,
                  borderTopWidth: CARET_SIZE,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: colors.contentPrimary,
                  marginTop: -1,
                }}
              />
            </Animated.View>
          </View>
        </Portal>
      )}
    </>
  );
};

export default CopyButton;
