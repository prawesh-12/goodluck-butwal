import Link from "next/link";
import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";
import { Badge, type AdminBadgeProps } from "@/components/ui/admin/badge";
import { Button } from "@/components/ui/admin/button";
import { Card } from "@/components/ui/admin/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/admin/pagination";
import { cn } from "@/components/ui/admin/cn";

type BadgeVariant = AdminBadgeProps["variant"];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  published: "success",
  draft: "secondary",
  archived: "outline",
  active: "success",
  deactivated: "outline",
  new: "default",
  pending: "warning",
  open: "success",
  filling_fast: "warning",
  full: "outline",
  closed: "outline",
  completed: "outline",
  in_progress: "warning",
  contacted: "secondary",
  converted: "success",
  confirmed: "success",
  registered: "success",
  attended: "success",
  cancelled: "outline",
  no_show: "outline",
  spam: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  filling_fast: "Filling fast",
  in_progress: "In progress",
  no_show: "No show",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"} className={cn("whitespace-nowrap", className)}>
      {statusLabel(status)}
    </Badge>
  );
}

export function FlatBadge({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {children}
    </Badge>
  );
}

export function RowAvatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (src) {
    return <img src={src} alt="" className="size-8 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
    >
      {initials || "?"}
    </span>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function ViewSiteLink({ href, label = "View" }: { href: string; label?: string }) {
  return (
    <Button variant="ghost" size="icon-sm" asChild title={`${label} on the website`}>
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink />
        <span className="sr-only">{label} on the website</span>
      </a>
    </Button>
  );
}

export function EditLink({ href, label = "Edit" }: { href: string; label?: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        <Pencil />
        {label}
      </Link>
    </Button>
  );
}

export function RowActionsTrigger({ label = "More actions" }: { label?: string }) {
  return (
    <Button variant="ghost" size="icon-sm">
      <MoreHorizontal />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export function DataCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn("overflow-hidden py-0 shadow-none", className)}>{children}</Card>;
}

export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  if (total === 0) return null;
  return (
    <p className="text-sm text-muted-foreground">
      Showing {shown} of {total} {noun}
    </p>
  );
}

export function Pager({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  const at = (target: number) => {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][],
    );
    next.set("page", String(target));
    return `?${next}`;
  };

  const window = [page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages);

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={at(page - 1)} />
          </PaginationItem>
        ) : null}
        {window.map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href={at(n)} isActive={n === page}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < pages ? (
          <PaginationItem>
            <PaginationNext href={at(page + 1)} />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
