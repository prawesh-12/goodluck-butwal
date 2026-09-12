"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  ChevronsUpDown,
  ExternalLink,
  Film,
  GraduationCap,
  Handshake,
  Image,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  Newspaper,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { can, type Actor } from "@/lib/auth/rbac";
import { NAV } from "@/components/layout/admin/admin-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/admin/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  member: "Member",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function AdminSidebar({ actor, name }: { actor: Actor; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const role = ROLE_LABEL[actor.role] ?? actor.role;

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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground" />}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">{initials(name)}</span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{role}</span>
                </span>
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="space-y-0.5">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs font-medium text-muted-foreground">{role}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden" render={<a href="/" target="_blank" rel="noreferrer" />}>
                  <ExternalLink />
                  View website
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    await signOut();
                    router.replace("/admin/login");
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
