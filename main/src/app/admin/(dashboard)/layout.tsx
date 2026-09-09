import type { ReactNode } from "react";
import { currentUserName, requireActor } from "@/lib/session";
import { Sidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const name = await currentUserName();

  return (
    <div className="admin flex min-h-screen bg-secondary/40">
      <Sidebar actor={actor} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar name={name ?? "Signed in"} role={actor.role} />
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
