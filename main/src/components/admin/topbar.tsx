"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  au_admin: "Australia",
  np_admin: "Nepal",
  content_editor: "Editor",
};

export function TopBar({ name, role }: { name: string; role: string }) {
  const router = useRouter();

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="admin-identity">
          <span className="t-base">{name}</span>
          <span className="admin-badge">{ROLE_LABEL[role] ?? role}</span>
        </div>

        <button
          type="button"
          className="admin-btn"
          onClick={async () => {
            await signOut();
            router.replace("/admin/login");
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
