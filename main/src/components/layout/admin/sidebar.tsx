import Link from "next/link";
import type { Actor } from "@/lib/auth/rbac";
import { NavLinks } from "@/components/layout/admin/nav-links";
import { Separator } from "@/components/ui/admin/separator";

export function Sidebar({ actor }: { actor: Actor }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col self-start overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* h-16 matches the topbar, or the separator below and the topbar border sit at
          different heights across the seam. */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/admin" aria-label="Goodluck admin dashboard">
          <img src="/brand/logo.png" alt="Goodluck" className="h-8 w-auto max-w-full object-contain object-left" />
        </Link>
      </div>
      <Separator className="shrink-0" />
      <div className="admin-sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <NavLinks actor={actor} />
      </div>
    </aside>
  );
}
