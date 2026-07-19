import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-bold text-primary", className)} {...props} />;
}
