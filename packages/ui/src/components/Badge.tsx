import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@warehousepos/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
        info:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        purple:
          'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-600',
            variant === 'warning' && 'bg-amber-600',
            variant === 'destructive' && 'bg-red-600',
            variant === 'info' && 'bg-blue-600',
            !variant || variant === 'default' && 'bg-current'
          )}
        />
      )}
      {children}
    </div>
  );
}

// Status Badge helper
interface StatusBadgeProps {
  status: string;
  statusConfig: Record<string, { label: string; color: string }>;
}

function StatusBadge({ status, statusConfig }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const variantMap: Record<string, BadgeProps['variant']> = {
    green: 'success',
    red: 'destructive',
    yellow: 'warning',
    blue: 'info',
    purple: 'purple',
  };

  return (
    <Badge variant={variantMap[config.color] || 'secondary'} dot>
      {config.label}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge };
