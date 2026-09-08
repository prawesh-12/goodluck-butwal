"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmConsultation } from "@/server/actions/leads";

export function ConfirmButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="btn-black-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await confirmConsultation({ id });
          setBusy(false);
          if (result.ok) router.refresh();
          else setError(result.error);
        }}
      >
        {busy ? "Confirming" : "Confirm"}
      </button>
      {error ? <span className="t-small admin-error">{error}</span> : null}
    </>
  );
}
