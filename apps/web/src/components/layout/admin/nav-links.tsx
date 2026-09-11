"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Film,
  GraduationCap,
  Handshake,
  Image,
  Inbox,
  Landmark,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { can, type Actor } from "@/lib/auth/rbac";
import { NAV } from "@/config/admin-nav";
import { cn } from "@/components/ui/admin/cn";

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/enquiries": Inbox,
  "/admin/consultations": CalendarCheck,
  "/admin/team": Users,
  "/admin/partners": Handshake,
  "/admin/posts": Newspaper,
  "/admin/events": CalendarDays,
  "/admin/institutions": Landmark,
  "/admin/courses": GraduationCap,
  "/admin/test-prep": Target,
  "/admin/images": Image,
  "/admin/videos": Film,
  "/admin/users": ShieldCheck,
};

export function NavLinks({ actor, onNavigate }: { actor: Actor; onNavigate?: () => void }) {
  const pathname = usePathname();

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(actor, item.entity, "read")),
  })).filter((group) => group.items.length > 0);

  const row = (href: string, label: string) => {
    const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    const Icon = ICONS[href] ?? LayoutDashboard;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-4 shrink-0 opacity-80" />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Admin sections" className="space-y-6">
      <ul className="space-y-0.5">{row("/admin", "Dashboard")}</ul>
      {groups.map((group) => (
        <div key={group.heading} className="space-y-1">
          <p className="px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.heading}
          </p>
          <ul className="space-y-0.5">{group.items.map((item) => row(item.href, item.label))}</ul>
        </div>
      ))}
    </nav>
  );
}
