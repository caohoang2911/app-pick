import { type VariantProps, cva } from 'class-variance-authority';
import { TouchableOpacity, View } from 'react-native';

import { cn } from '../lib/utils';

const alertVariants = cva('rounded-lg flex justify-center', {
  variants: {
    variant: {
      info: 'text-blue-50',
      danger: 'bg-red-50',
      success: 'bg-green-50',
      warning: 'bg-yellow-50',
      default: 'bg-gray-50',
    },
    size: {
      default: 'p-4',
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
  labelClasses?: string;
  disabed?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}
function SectionAlert({
  labelClasses,
  className,
  variant = 'default',
  size,
  loading = false,
  disabled,
  children,
  ...props
}: AlertProps) {
  return (
    <View
      className={cn(alertVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </View>
  );
}

export { SectionAlert };
