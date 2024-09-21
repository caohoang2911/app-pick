import { type VariantProps, cva } from 'class-variance-authority';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { cn } from '../lib/utils';
import Loading from './Loading';

const buttonVariants = cva(
  'flex flex-row items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary bg-blue-500',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        ghost: 'bg-slate-700',
        warning: 'bg-orange-500',
        link: 'text-primary underline-offset-4',
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

const buttonTextVariants = cva('text-center font-medium', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      warning: 'text-white',
      ghost: 'text-primary-foreground',
      link: 'text-primary-foreground underline',
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

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
    VariantProps<typeof buttonVariants> {
  label: string;
  labelClasses?: string;
  disabed?: boolean;
  loading?: boolean;
}
function Button({
  label,
  labelClasses,
  className,
  variant = 'default',
  size,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      disabled={loading || disabled}
      className={cn(buttonVariants({ variant, size, className }), {
        'bg-gray-500': disabled,
      })}
      {...props}
    >
      <Text
        className={cn(
          buttonTextVariants({ variant, size, className: labelClasses })
        )}
      >
        {label}
      </Text>
      {loading && <ActivityIndicator className="text-white ml-2 " />}
    </TouchableOpacity>
  );
}

export { Button, buttonVariants, buttonTextVariants };
