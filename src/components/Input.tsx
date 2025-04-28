import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { CloseLine } from '../core/svgs';
import { cn } from '../lib/utils';

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

    const WrapperInput: any = useBottomSheetTextInput ? BottomSheetTextInput : TextInput
    
    return (
      <View className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <Text className={cn('text-base', labelClasses)}>{label}</Text>
        )}
        <View className="relative">
          {prefix && (
            <View className="absolute left-3 top-0 bottom-0 flex items-center justify-center z-10">
              {prefix}
            </View>
          )}
          <WrapperInput
            ref={ref}
            className={cn(
              inputClasses,
              'border border-input border-slate-300 py-2.5 pl-3 pr-3 rounded-lg bg-white',
              clsx({ 'pl-10': prefix }, { 'pr-10': suffix }, { 'bg-gray-100': !editable})
            )}
            editable={editable}
            {...props}
          />
          {suffix && (
            <View className="absolute right-3 top-0 bottom-0 flex items-center justify-center">
              {suffix}
            </View>
          )}
          {props.value && allowClear && (
            <Pressable
              onPress={onClear}
              className="absolute top-0 bottom-0 right-2 flex items-center justify-center"
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
