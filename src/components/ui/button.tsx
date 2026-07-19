import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary px-5 text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary px-5 text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border bg-background px-5 hover:bg-muted",
        ghost: "px-3 hover:bg-muted",
        danger: "bg-destructive px-5 text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
