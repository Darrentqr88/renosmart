import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8EF7]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-[#4F8EF7] text-white hover:bg-[#3B7BE8] active:bg-[#2563EB] shadow-sm',
        destructive: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
        outline: 'border border-[#E2E4EE] bg-white text-[#1A1A2E] hover:bg-[#F3F4F8]',
        secondary: 'bg-[#F3F4F8] text-[#1A1A2E] hover:bg-[#E2E4EE]',
        ghost: 'text-[#1A1A2E] hover:bg-[#F3F4F8]',
        link: 'text-[#4F8EF7] underline-offset-4 hover:underline',
        gold: 'bg-gradient-to-r from-[#4F8EF7] via-[#8B5CF6] to-[#EC4899] text-white font-semibold shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
