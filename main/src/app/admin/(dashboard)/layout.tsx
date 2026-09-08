import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth, requireActor } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="admin">
      <Sidebar actor={actor} />
      <div className="admin-main">
        <TopBar name={session?.user.name ?? "Signed in"} role={actor.role} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
