"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkPartnersToInstitutions } from "@/features/institutions/actions";
import { Button } from "@/components/ui/admin/button";

// Partner logos and institutions are two tables today. This joins the rows whose names already
// match, so the home page ticker and the institution pages read from one source.
export function InstitutionPartnerLink() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await linkPartnersToInstitutions();
          setBusy(false);
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage(
            result.data.linked === 0
              ? "No partner logo has a name matching an institution, so nothing changed."
              : `Linked ${result.data.linked} partner ${result.data.linked === 1 ? "logo" : "logos"}.`,
          );
          router.refresh();
        }}
      >
        {busy ? "Matching" : "Match partner logos"}
      </Button>
      <span className="text-xs text-muted-foreground">
        Links a partner logo to the institution with the same name. Nothing is renamed or guessed.
      </span>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
