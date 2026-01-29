import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@warehousepos/utils';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-background text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-input focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary',
        error:
          'border-destructive focus-visible:ring-2 focus-visible:ring-destructive/50',
        success:
          'border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/50',
      },
      inputSize: {
        default: 'h-10 px-3 py-2',
        sm: 'h-9 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error;
    const actualVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              {leftAddon}
            </div>
          )}
          {leftIcon && (
            <div className="absolute left-3 flex items-center text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: actualVariant, inputSize }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              leftAddon && 'rounded-l-none',
              rightAddon && 'rounded-r-none',
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
          {rightAddon && (
            <div className="flex h-10 items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
