"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { Badge } from "@/components/ui/admin/badge";
import { Button } from "@/components/ui/admin/button";
import { Separator } from "@/components/ui/admin/separator";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  au_admin: "Australia",
  np_admin: "Nepal",
  content_editor: "Editor",
};

export function TopBar({ name, role }: { name: string; role: string }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <Badge variant="secondary">{ROLE_LABEL[role] ?? role}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Separator className="h-5 w-px" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              router.replace("/admin/login");
            }}
          >
            <LogOut />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
