"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRegistration } from "@/server/actions/test-prep";

const STATUSES = ["registered", "attended", "cancelled"];

export function RegistrationStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <select
        value={status}
        disabled={busy}
        onChange={async (event) => {
          setBusy(true);
          const result = await updateRegistration({ id, status: event.target.value });
          setBusy(false);
          setError(result.ok ? null : result.error);
          if (result.ok) router.refresh();
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error ? <span className="admin-clash">{error}</span> : null}
    </>
  );
}
