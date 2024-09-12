import { type VariantProps, cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'flex flex-row items-center rounded-full px-2 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-blue-50',
        secondary: 'bg-gray-50',
        danger: 'bg-red-50',
        destructive: 'bg-destructive',
        success: 'bg-green-500 dark:bg-green-700',
        // 'CONFIRMED' | 'STORE_PICKING' | 'STORE_PACKED';
        confirmed: 'bg-blue-50',
        store_picking: 'bg-orange-50',
        store_packed: 'bg-purple-50',
        completed: 'bg-green-50',
        cancelled: 'bg-red-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('font-medium text-center text-xs', {
  variants: {
    variant: {
      default: 'blue text-blue-600',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      danger: 'text-red-600',
      success: 'text-green-100',
      confirmed: 'text-blue-600',
      store_picking: 'text-orange-600',
      store_packed: 'text-purple-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  extraLabel?: string | React.ReactNode;
  label: string;
  labelClasses?: string;
}
function Badge({
  label,
  extraLabel,
  labelClasses,
  className,
  variant,
  children,
  ...props
}: BadgeProps) {
  return (
    <View
      className={cn(badgeVariants({ variant }), 'rounded-full', className)}
      {...props}
    >
      <Text className={cn(badgeTextVariants({ variant }), labelClasses)}>
        {label} {extraLabel}
      </Text>
    </View>
  );
}

export { Badge, badgeVariants };
