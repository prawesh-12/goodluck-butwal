"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmConsultation } from "@/features/leads/actions";
import { Button } from "@/components/ui/admin/button";

export function ConfirmButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
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
      </Button>
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </>
  );
}
