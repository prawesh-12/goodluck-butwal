"use client";

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    toastOptions={{
      classNames: {
        toast: "gap-3 shadow-lg",
        title: "text-sm font-medium",
        description: "text-xs text-muted-foreground",
        success: "[&_[data-icon]]:text-success",
        warning: "[&_[data-icon]]:text-warning",
        error: "[&_[data-icon]]:text-destructive",
        info: "[&_[data-icon]]:text-muted-foreground",
      },
    }}
    style={
      {
        "--normal-bg": "var(--color-popover)",
        "--normal-text": "var(--color-popover-foreground)",
        "--normal-border": "var(--color-border)",
        "--border-radius": "var(--radius-md)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
