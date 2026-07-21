import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn("flex h-12 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-base shadow-sm outline-none transition placeholder:text-muted-foreground hover:border-primary/45 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm", className)} {...props} />
  ),
);
Input.displayName = "Input";
