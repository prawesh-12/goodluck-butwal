"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/admin/card";
import { cn } from "@/components/ui/admin/cn";

export function EditorLayout({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  if (!aside) return <div className="space-y-6">{children}</div>;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">{aside}</aside>
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
// editor, and Delete sits apart from it so the two are never hit by accident. The negative
// margins cancel the padding on <main>, otherwise the bar lifts off the window edge at the
// bottom of the page.
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
    <div className="sticky bottom-0 z-20 -mx-4 -mb-6 border-t border-border bg-background px-4 py-3 shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.25)] sm:-mx-6 sm:-mb-8 sm:px-6">
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

// The settings a writer almost never touches, folded away so they do not compete with the work.
// <details> is the native disclosure: keyboard and screen reader behaviour for free, and `open`
// forces it back into view when something inside it was rejected.
export function AdvancedSection({
  title = "Advanced",
  open,
  className,
  children,
}: {
  title?: string;
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className={cn("group border-t border-border pt-4", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
        {title}
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}
