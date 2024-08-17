import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/utils';
import clsx from 'clsx';
import { TextInput } from 'react-native-gesture-handler';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  [key: string]: any;
}
const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    { className, label, suffix, prefix, labelClasses, inputClasses, ...props },
    ref
  ) => {
    return (
      <View className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <Text className={cn('text-base', labelClasses)}>{label}</Text>
        )}
        <View className="relative">
          <TextInput
            className={cn(
              inputClasses,
              'border border-input border-slate-300 py-2.5 pl-3 pr-3 rounded-lg bg-white',
              clsx({ 'pl-10': prefix }, { 'pr-10': suffix })
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
        </View>
      </View>
    );
  }
);

export { Input };
