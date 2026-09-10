import type { ReactNode } from "react";
import { currentUserName, requireActor } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/admin/sidebar";
import { TopBar } from "@/components/layout/admin/topbar";
import { Toaster } from "@/components/ui/admin/sonner";
import { TooltipProvider } from "@/components/ui/admin/tooltip";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const name = await currentUserName();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="admin flex min-h-screen bg-secondary/40">
        <Sidebar actor={actor} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar name={name ?? "Signed in"} actor={actor} />
          <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </TooltipProvider>
  );
}
