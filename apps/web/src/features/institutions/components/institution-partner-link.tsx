"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";
import { useAction } from "@/components/shared/admin/use-action";
import { linkPartnersToInstitutions } from "@/features/institutions/actions";

// Joins partner rows to institutions whose names already match, so both read one source.
export function InstitutionPartnerLink() {
  const router = useRouter();
  const { busy, run } = useAction();
  const [outcome, setOutcome] = useState<string | null>(null);

  const match = async () => {
    const result = await run(() => linkPartnersToInstitutions(), {
      success: "Partner logos matched",
      failure: "Couldn't match the partner logos.",
    });
    if (!result) return;
    setOutcome(
      result.linked === 0
        ? "No partner logo has a name matching an institution, so nothing changed."
        : `Linked ${result.linked} partner ${result.linked === 1 ? "logo" : "logos"}.`,
    );
    router.refresh();
  };

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">Match partner logos</p>
          <p className="text-xs text-muted-foreground">
            Links a partner logo to the institution with the same name. Nothing is renamed or guessed.
          </p>
          {outcome ? <p className="text-xs text-muted-foreground">{outcome}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={match}>
          {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
          {busy ? "Matching..." : "Match logos"}
        </Button>
      </CardContent>
    </Card>
  );
}
