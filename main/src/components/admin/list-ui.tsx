import Link from "next/link";
import { Check, ExternalLink, TriangleAlert, type LucideIcon } from "lucide-react";
import { Badge, type AdminBadgeProps } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/cn";

type BadgeVariant = AdminBadgeProps["variant"];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  published: "success",
  scheduled: "secondary",
  draft: "outline",
  archived: "outline",
  new: "default",
  pending: "default",
  open: "success",
  filling_fast: "secondary",
  full: "outline",
  closed: "outline",
  completed: "outline",
  in_progress: "secondary",
  contacted: "secondary",
  converted: "success",
  confirmed: "success",
  registered: "success",
  attended: "success",
  cancelled: "outline",
  no_show: "outline",
  spam: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"} className="whitespace-nowrap">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function ConsentBadge({ given }: { given: boolean }) {
  return given ? (
    <Badge variant="success" className="whitespace-nowrap">
      <Check /> Recorded
    </Badge>
  ) : (
    <Badge variant="destructive" className="whitespace-nowrap">
      <TriangleAlert /> Missing
    </Badge>
  );
}

export function FlatBadge({ children, variant = "secondary" }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {children}
    </Badge>
  );
}

export function RowAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
    >
      {initials || "?"}
    </span>
  );
}

export function ListHeader({
  title,
  count,
  countNoun = "matching",
  actions,
}: {
  title: string;
  count?: number;
  countNoun?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {count !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {count} {countNoun}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function ViewSiteLink({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className={cn("whitespace-nowrap")}>
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink /> View
      </a>
    </Button>
  );
}

export function EditLink({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>Edit</Link>
    </Button>
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
  return (
    <nav className="flex items-center gap-3" aria-label="Pages">
      {page > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>Previous</Link>
        </Button>
      ) : null}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next</Link>
        </Button>
      ) : null}
    </nav>
  );
}

export function EmptyState({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export function FilterCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export function SearchField({
  id,
  value,
  defaultValue,
  placeholder,
  onChange,
}: {
  id: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Search</Label>
      <Input id={id} value={value} defaultValue={defaultValue} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
