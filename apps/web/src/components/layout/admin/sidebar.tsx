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
import { NAV } from "@/components/layout/admin/admin-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/admin/sidebar";

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

export function AdminSidebar({ actor }: { actor: Actor }) {
  const pathname = usePathname();

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(actor, item.entity, "read")),
  })).filter((group) => group.items.length > 0);

  const row = (href: string, label: string) => {
    const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    const Icon = ICONS[href] ?? LayoutDashboard;
    return (
      <SidebarMenuItem key={href}>
        <SidebarMenuButton isActive={active} tooltip={label} render={<Link href={href} aria-current={active ? "page" : undefined} />}>
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      {/* h-16 matches the topbar, or the two top borders sit at different heights across the seam. */}
      <SidebarHeader className="flex h-16 shrink-0 flex-row items-center border-b border-sidebar-border px-3">
        <Link href="/admin" aria-label="Goodluck admin dashboard" className="flex items-center">
          <img src="/brand/logo.png" alt="Goodluck" className="h-8 w-auto max-w-full object-contain object-left group-data-[collapsible=icon]:hidden" />
          <img src="/brand/mark.png" alt="" className="hidden size-8 object-contain group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{row("/admin", "Dashboard")}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {groups.map((group) => (
          <SidebarGroup key={group.heading}>
            <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map((item) => row(item.href, item.label))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
