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
          <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
        {/* Below the topbar, so a toast never lands on View website or the account menu. */}
        <Toaster
          position="top-right"
          offset={{ top: "84px", right: "24px" }}
          mobileOffset={{ top: "72px", right: "16px", left: "16px" }}
        />
      </div>
    </TooltipProvider>
  );
}
