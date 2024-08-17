import { type VariantProps, cva } from 'class-variance-authority';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { cn } from '../lib/utils';

const alertVariants = cva(
  'flex flex-row items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        info: 'text-blue-50',
        danger: 'bg-red-50',
        success: 'bg-green-50',
        warning: 'bg-yellow-50',
        default: 'bg-gray-50',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-2',
        lg: 'h-12 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const alertTextVariants = cva('text-center font-medium', {
  variants: {
    variant: {
      info: 'text-blue-800',
      danger: 'text-red-800',
      success: 'text-green-800',
      warning: 'text-yellow-800',
      default: 'text-gray-800',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface AlertProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
    VariantProps<typeof alertVariants> {
  label: string;
  labelClasses?: string;
  disabed?: boolean;
  loading?: boolean;
}
function Alert({
  label,
  labelClasses,
  className,
  variant = 'default',
  size,
  loading = false,
  disabled,
  ...props
}: AlertProps) {
  return (
    // <TouchableOpacity
    //   disabled={loading || disabled}
    //   className={cn(alertVariants({ variant, size, className }), {
    //     'bg-gray-200': disabled,
    //   })}
    //   {...props}
    // >
    //   <Text
    //     className={cn(
    //       alertTextVariants({ variant, size, className: labelClasses })
    //     )}
    //   >
    //     {label}
    //   </Text>
    //   {loading && <ActivityIndicator className="text-white ml-2 " />}
    // </TouchableOpacity>
    <View
      className={cn(alertVariants({ variant, size, className }), {
        'bg-gray-200': disabled,
      })}
      // className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
    >
      <Text>Change a few things up and try submitting again.</Text>
    </View>
  );
}

export { Alert };
