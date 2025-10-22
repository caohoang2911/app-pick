import { type VariantProps, cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

const badgeVariants = cva(
  'flex flex-row items-center rounded-full px-1.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-blue-50',
        secondary: 'bg-gray-50',
        transparent: 'bg-gray-transparent',
        warning: 'bg-orange-50',
        danger: 'bg-red-50',
        pink: 'bg-pink-50',
        destructive: 'bg-destructive',
        success: 'bg-green-50',
        // 'CONFIRMED' | 'STORE_PICKING' | 'STORE_PACKED';
        confirmed: 'bg-blue-50',
        store_picking: 'bg-orange-50',
        store_packed: 'bg-purple-50',
        completed: 'bg-green-50',
        cancelled: 'bg-red-50',
        purple: 'bg-purple-50',
        booked_shipper: 'bg-pink-50',
        shipping: 'bg-green-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('font-medium text-center', {
  variants: {
    variant: {
      default: 'blue text-blue-600',
      secondary: 'text-secondary-foreground',
      transparent: 'text-gray-500',
      destructive: 'text-destructive-foreground',
      pink: 'text-pink-600',
      danger: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-orange-600',
      confirmed: 'text-blue-600',
      store_picking: 'text-orange-600',
      store_packed: 'text-purple-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600',
      purple: 'text-purple-600',
      shipping: 'text-green-600',
      booked_shipper: 'text-pink-600',
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
  icon?: React.ReactNode,
  label: string | React.ReactNode;
  labelClasses?: string;
}
function Badge({
  label,
  extraLabel,
  labelClasses,
  className,
  variant,
  children,
  icon,
  ...props
}: BadgeProps) {
  return (
    <View
      className={`${badgeVariants({ variant })} rounded-full items-center w-auto ${className}`}
      {...props}
    >
      {icon}
      <Text numberOfLines={1} ellipsizeMode='tail' className={`${badgeTextVariants({ variant })} ${labelClasses || "text-xs"}`}>
        {label} {extraLabel}
      </Text>
    </View>
  );
}

export { Badge, badgeVariants };
