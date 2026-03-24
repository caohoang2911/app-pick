import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { CloseLine } from '../core/svgs';
import { cn } from '../lib/utils';

export interface InputProps extends React.ComponentPropsWithoutRef<
  typeof TextInput
> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  error?: string;
  allowClear?: boolean;
  useBottomSheetTextInput?: boolean;
  editable?: boolean;
  onClear?: () => void;
  [key: string]: any;
}

const INPUT_HEIGHT = 44;

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      className,
      label,
      suffix,
      prefix,
      labelClasses,
      inputClasses,
      allowClear,
      onClear,
      error,
      useBottomSheetTextInput = false,
      editable = true,
      ...props
    },
    ref,
  ) => {
    const { textAlignVertical, style, ...restProps } = props;

    const WrapperInput: any = useBottomSheetTextInput
      ? BottomSheetTextInput
      : TextInput;

    const showClear = props.value && allowClear;
    const hasSuffixOrClear = suffix || showClear;

    return (
      <View className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <Text className={cn('text-base text-gray-700', labelClasses)}>
            {label}
          </Text>
        )}
        <View className="relative">
          {/* Prefix */}
          {prefix && <View style={styles.prefixContainer}>{prefix}</View>}

          <WrapperInput
            ref={ref}
            className={cn(
              'border border-slate-300 rounded-lg bg-white text-base text-gray-900',
              clsx({
                'pl-11': prefix,
                'pr-11': hasSuffixOrClear,
                'pl-3': !prefix,
                'pr-3': !hasSuffixOrClear,
                'bg-gray-100 text-gray-400': !editable,
              }),
              inputClasses,
            )}
            editable={editable}
            placeholderTextColor="#9CA3AF"
            textAlignVertical={
              textAlignVertical ??
              (Platform.OS === 'android' ? 'center' : undefined)
            }
            style={[styles.input, !editable && styles.inputDisabled, style]}
            {...restProps}
          />

          {/* Suffix */}
          {suffix && !showClear && (
            <View style={styles.suffixContainer}>{suffix}</View>
          )}

          {/* Clear button */}
          {showClear && (
            <Pressable
              onPress={onClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.suffixContainer}
            >
              <View style={styles.clearButton}>
                <CloseLine width={20} height={20} color="#9CA3AF" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error && <Text className="text-red-500 text-sm">{error}</Text>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  input: {
    height: INPUT_HEIGHT,
    // Loại bỏ extra font padding của Android
    includeFontPadding: false,
    // Đồng bộ padding theo platform
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
    // Fix Android underline mặc định
    ...(Platform.OS === 'android' && {
      paddingTop: 8,
      paddingBottom: 8,
    }),
    lineHeight: 16,
  },
  inputDisabled: {
    opacity: Platform.OS === 'android' ? 0.6 : 1,
  },
  prefixContainer: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suffixContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    padding: 2,
  },
});

export { Input };
