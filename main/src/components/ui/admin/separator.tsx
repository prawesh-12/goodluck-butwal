import * as React from "react";
import { cn } from "@/components/ui/admin/cn";

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="separator" role="separator" className={cn("shrink-0 bg-border h-px w-full", className)} {...props} />;
}

export { Separator };
