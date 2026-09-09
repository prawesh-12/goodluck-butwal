"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEnquiry } from "@/features/leads/actions";
import { Select } from "@/components/shared/admin/repeater";
import { Button } from "@/components/ui/admin/button";
import { Label } from "@/components/ui/admin/label";
import { Textarea } from "@/components/ui/admin/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/admin/card";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export function EnquiryEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Handling</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            const form = new FormData(event.currentTarget);
            const result = await updateEnquiry({
              id,
              status: form.get("status"),
              internalNotes: form.get("internalNotes"),
            });
            setBusy(false);
            setMessage(result.ok ? "Saved." : result.error);
            if (result.ok) router.refresh();
          }}
        >
          <Select
            label="Status"
            name="status"
            defaultValue={status}
            options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          />

          <div className="space-y-1.5">
            <Label htmlFor="enquiry-notes">Internal notes</Label>
            <Textarea id="enquiry-notes" name="internalNotes" defaultValue={notes} rows={4} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving" : "Save"}
            </Button>
            {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
