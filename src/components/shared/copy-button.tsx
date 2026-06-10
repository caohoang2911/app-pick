import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Clipboard, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { colors } from '~/src/ui/colors';

const RESET_DELAY_MS = 1500;

type Props = {
  value: string;
  size?: number;
};

const CopyButton = ({ value, size = 16 }: Props) => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const toastOpacity = useRef(new Animated.Value(0)).current;

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
    setCopied(true);
    showToast();

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, RESET_DELAY_MS);
  }, [value, showToast]);

  return (
    <View className="flex-row items-center">
      <TouchableOpacity onPress={handleCopy} hitSlop={8} activeOpacity={0.7}>
        <Feather
          name={copied ? 'check' : 'copy'}
          size={size}
          color={colors.colorPrimary}
        />
      </TouchableOpacity>
      {copied && (
        <Animated.Text
          style={{
            opacity: toastOpacity,
            fontSize: 11,
            color: colors.gray[500],
            marginLeft: 4,
          }}
        >
          Đã copy
        </Animated.Text>
      )}
    </View>
  );
};

export default CopyButton;
