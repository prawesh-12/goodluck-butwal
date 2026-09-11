import Link from "next/link";
import { ChevronLeft, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Separator } from "@/components/ui/admin/separator";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 h-7 px-2 text-muted-foreground">
      <Link href={href}>
        <ChevronLeft />
        {children}
      </Link>
    </Button>
  );
}

export function EditorHeader({
  backHref,
  backLabel,
  title,
  meta,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <BackLink href={backHref}>{backLabel}</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <Separator />
    </div>
  );
}

// §28: the public page opens in a new tab, and the address itself never appears as prose.
export function ViewOnSiteButton({
  href,
  label = "View on site",
  variant = "outline",
  className,
}: {
  href: string;
  label?: string;
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
}) {
  return (
    <Button variant={variant} size="sm" asChild className={className}>
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink />
        {label}
      </a>
    </Button>
  );
}

// A draft has no public page yet, so previewing it goes through the signed preview route the
// project already has.
export function PreviewButton({ href, className }: { href: string; className?: string }) {
  return (
    <Button variant="outline" size="sm" asChild className={className}>
      <a href={href} target="_blank" rel="noreferrer">
        <Eye />
        Preview
      </a>
    </Button>
  );
}
