"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRegistration } from "@/features/test-prep/actions";
import { Dropdown } from "@/components/shared/admin/dropdown";

const STATUSES = ["registered", "attended", "cancelled"];

export function RegistrationStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Dropdown
        ariaLabel="Registration status"
        value={status}
        disabled={busy}
        options={STATUSES.map((s) => ({ value: s, label: s }))}
        onChange={async (next) => {
          setBusy(true);
          const result = await updateRegistration({ id, status: next });
          setBusy(false);
          setError(result.ok ? null : result.error);
          if (result.ok) router.refresh();
        }}
      />
      {error ? <span className="admin-clash">{error}</span> : null}
    </>
  );
}
