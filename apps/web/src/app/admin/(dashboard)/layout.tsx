import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { currentUserName, requireActor } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { TopBar } from "@/components/layout/admin/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/admin/sidebar";
import { Toaster } from "@/components/ui/admin/sonner";
import { TooltipProvider } from "@/components/ui/admin/tooltip";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const name = await currentUserName();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider delay={300}>
      <SidebarProvider defaultOpen={sidebarOpen} className="admin bg-secondary/40">
        <AdminSidebar actor={actor} />
        <SidebarInset className="min-w-0 bg-transparent">
          <TopBar name={name ?? "Signed in"} actor={actor} />
          <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </SidebarInset>
        {/* Below the topbar, so a toast never lands on View website or the account menu. */}
        <Toaster
          position="top-right"
          offset={{ top: "84px", right: "24px" }}
          mobileOffset={{ top: "72px", right: "16px", left: "16px" }}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}
