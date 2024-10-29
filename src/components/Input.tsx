import { forwardRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '../lib/utils';
import clsx from 'clsx';
import { TextInput } from 'react-native-gesture-handler';
import { CloseLine } from '../core/svgs';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  error?: string;
  allowClear?: boolean;
  useBottomSheetTextInput?: boolean;
  editable?: boolean;
  onClear: () => void;
  [key: string]: any;
}
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
    ref
  ) => {

    const WrapperInput = useBottomSheetTextInput ? BottomSheetTextInput : TextInput
    
    return (
      <View className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <Text className={cn('text-base', labelClasses)}>{label}</Text>
        )}
        <View className="relative">
          <WrapperInput
            className={cn(
              inputClasses,
              'border border-input border-slate-300 py-2.5 pl-3 pr-3 rounded-lg bg-white',
              clsx({ 'pl-10': prefix }, { 'pr-10': suffix }, { 'bg-gray-100': !editable})
            )}
            {...props}
          />
          {suffix && (
            <View className="absolute top-1/2 right-3 transform -translate-y-1/2">
              {suffix && suffix}
            </View>
          )}
          {prefix && (
            <View className="absolute top-1/2 left-3 transform -translate-y-1/2">
              {prefix && prefix}
            </View>
          )}
          {props.value && allowClear && (
            <Pressable
              onPress={onClear}
              className="absolute top-1/2 right-2 -translate-y-1/2  "
            >
              <View className="rounded-full bg-gray-50">
                <CloseLine width={20} height={20} color={'#dfdfdf'} />
              </View>
            </Pressable>
          )}
        </View>
          {/* error */}
          {error && <Text className="text-red-500 text-sm">{error}</Text>}
      </View>
    );
  }
);

export { Input };
