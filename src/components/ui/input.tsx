import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = invalid ?? (ariaInvalid === true || ariaInvalid === 'true');

    return (
      <input
        ref={ref}
        aria-invalid={isInvalid || undefined}
        className={cn(
          'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs ring-offset-background transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
