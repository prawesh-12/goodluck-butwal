"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import type { Actor } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/admin/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/admin/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/admin/sidebar";

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

export function TopBar({ name, actor }: { name: string; actor: Actor }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Link href="/admin" className="md:hidden" aria-label="Goodluck admin dashboard">
            <img src="/brand/logo.png" alt="Goodluck" className="h-6 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex" nativeButton={false} render={<a href="/" target="_blank" rel="noreferrer" />}>
              <ExternalLink />
              View website
            </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-auto gap-2 px-2 py-1.5" />}>
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(name)}
                </span>
                <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
                  <span className="max-w-40 truncate">{name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {ROLE_LABEL[actor.role] ?? actor.role}
                  </span>
                </span>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs font-medium text-muted-foreground">{ROLE_LABEL[actor.role] ?? actor.role}</p>
              </DropdownMenuLabel>
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
        </div>
      </div>
    </header>
  );
}
