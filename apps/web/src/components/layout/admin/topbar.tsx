"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { SidebarTrigger } from "@/components/ui/admin/sidebar";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background">
      <div className="flex h-full w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Link href="/admin" className="md:hidden" aria-label="Goodluck admin dashboard">
            <img src="/brand/logo.png" alt="Goodluck" className="h-6 w-auto object-contain" />
          </Link>
        </div>

        <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex" nativeButton={false} render={<a href="/" target="_blank" rel="noreferrer" />}>
          <ExternalLink />
          View website
        </Button>
      </div>
    </header>
  );
}
