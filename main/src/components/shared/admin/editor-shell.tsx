"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/admin/card";
import { cn } from "@/components/ui/admin/cn";

export function EditorLayout({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  if (!aside) return <div className="space-y-6">{children}</div>;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-6 lg:sticky lg:top-20">{aside}</aside>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("space-y-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

// The bar sticks to the bottom of the viewport so Save never scrolls out of reach on a long
// editor, and Delete sits apart from it so the two are never hit by accident.
export function EditorActionBar({
  dirty,
  busy,
  saveLabel = "Save",
  savingLabel = "Saving...",
  secondary,
  destructive,
}: {
  dirty: boolean;
  busy: boolean;
  saveLabel?: string;
  savingLabel?: string;
  secondary?: React.ReactNode;
  destructive?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background px-4 py-3 shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.25)] sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {destructive}
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {busy ? savingLabel : dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondary}
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {busy ? savingLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
