import type { ReactNode } from "react";
import { currentUserName, requireActor } from "@/lib/session";
import { Sidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const name = await currentUserName();

  return (
    <div className="admin">
      <Sidebar actor={actor} />
      <div className="admin-main">
        <TopBar name={name ?? "Signed in"} role={actor.role} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
