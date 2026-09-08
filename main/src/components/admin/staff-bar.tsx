"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminUrlForPath } from "@/lib/preview";

type Session = { signedIn: boolean; name?: string; role?: string };

// Fetches after hydration on purpose: nothing about the signed-in user may reach the server
// render, or the cached public HTML would differ per visitor.
export function StaffBar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/session")
      .then((res) => res.json() as Promise<Session>)
      .then((data) => {
        if (live) setSession(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!session?.signedIn) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/preview")) return null;

  return (
    <div
      style={{
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "8px 16px",
        background: "#111",
        color: "#fff",
        font: "13px/1.4 system-ui, sans-serif",
      }}
    >
      <span>
        {session.name} · {session.role}
      </span>
      <Link href={adminUrlForPath(pathname)} style={{ color: "#fff", textDecoration: "underline" }}>
        Edit this page
      </Link>
      <Link href="/admin" style={{ color: "#fff", textDecoration: "underline" }}>
        Admin
      </Link>
    </div>
  );
}
