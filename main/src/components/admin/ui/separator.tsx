import * as React from "react";
import { cn } from "./cn";

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="separator" role="separator" className={cn("shrink-0 bg-border h-px w-full", className)} {...props} />;
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-accent", className)} {...props} />;
}

export { Separator, Skeleton };
