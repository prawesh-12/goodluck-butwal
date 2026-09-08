"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, type Actor } from "@/lib/rbac";
import { NAV } from "./nav-items";

export function Sidebar({ actor }: { actor: Actor }) {
  const pathname = usePathname();

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(actor, item.entity, "read")),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="admin-sidebar" aria-label="Admin sections">
      <Link href="/admin" className="admin-brand">
        Goodluck
      </Link>

      {groups.map((group) => (
        <div key={group.heading} className="admin-nav-group">
          <p className="admin-nav-heading">{group.heading}</p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="admin-nav-link"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
