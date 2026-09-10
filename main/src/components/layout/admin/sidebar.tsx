"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Film,
  FileText,
  GraduationCap,
  Image,
  Inbox,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";
import { can, type Actor } from "@/lib/auth/rbac";
import { NAV } from "@/config/admin-nav";
import { cn } from "@/components/ui/admin/cn";
import { Separator } from "@/components/ui/admin/separator";

const ICONS: Record<string, LucideIcon> = {
  "/admin/enquiries": Inbox,
  "/admin/consultations": CalendarDays,
  "/admin/team": Users,
  "/admin/partners": Users,
  "/admin/posts": Newspaper,
  "/admin/events": CalendarDays,
  "/admin/institutions": GraduationCap,
  "/admin/courses": FileText,
  "/admin/test-prep": GraduationCap,
  "/admin/images": Image,
  "/admin/videos": Film,
  "/admin/users": Users,
};

export function Sidebar({ actor }: { actor: Actor }) {
  const pathname = usePathname();

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(actor, item.entity, "read")),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="sticky top-0 flex h-screen max-h-screen w-64 shrink-0 self-start flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 px-5 pb-4 pt-6">
        <Link href="/admin" aria-label="Goodluck admin dashboard">
          <img src="/brand/logo.png" alt="Goodluck" className="h-8 w-auto max-w-full object-contain object-left" />
        </Link>
      </div>
      <Separator className="shrink-0" />
      <nav aria-label="Admin sections" className="admin-sidebar-nav min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = ICONS[item.href] ?? FileText;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      data-active={active || undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                      )}
                    >
                      <Icon className="size-4 shrink-0 opacity-70" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
