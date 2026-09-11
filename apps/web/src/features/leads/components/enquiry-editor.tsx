"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectField, TextAreaField } from "@/components/shared/admin/fields";
import { SectionCard } from "@/components/shared/admin/editor-shell";
import { statusLabel } from "@/components/shared/admin/list-ui";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { useAction } from "@/components/shared/admin/use-action";
import { Button } from "@/components/ui/admin/button";
import { updateEnquiry } from "@/features/leads/actions";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export function EnquiryEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [current, setCurrent] = useState(status);
  const [text, setText] = useState(notes);
  const [dirty, setDirty] = useState(false);

  // The update carries both fields every time, because sending one on its own clears the other.
  // It answers with no payload, so the call is wrapped in the shape useAction expects.
  const save = (nextStatus: string, nextNotes: string, copy: { success: string; failure: string }) =>
    run(async () => {
      const result = await updateEnquiry({ id, status: nextStatus, internalNotes: nextNotes });
      return result.ok ? { ok: true as const, data: true as const } : result;
    }, copy);

  const changeStatus = async (next: string) => {
    setCurrent(next);
    const saved = await save(next, text, {
      success: "Enquiry status updated",
      failure: "Couldn't update the enquiry.",
    });
    if (saved) {
      setDirty(false);
      router.refresh();
    } else {
      setCurrent(current);
    }
  };

  const saveNotes = async () => {
    const saved = await save(current, text, {
      success: "Notes saved",
      failure: "Couldn't update the enquiry.",
    });
    if (saved) {
      setDirty(false);
      router.refresh();
    }
  };

  return (
    <SectionCard title="Status">
      <UnsavedGuard dirty={dirty} />

      <SelectField
        name="status"
        label="Status"
        value={current}
        disabled={busy}
        options={STATUSES.map((option) => ({ value: option, label: statusLabel(option) }))}
        onChange={changeStatus}
      />

      <TextAreaField
        name="internalNotes"
        label="Internal notes"
        value={text}
        rows={5}
        onChange={(next) => {
          setText(next);
          setDirty(true);
        }}
      />

      <div className="flex items-center gap-3">
        <Button type="button" disabled={busy || !dirty} onClick={saveNotes}>
          {busy ? "Saving..." : "Save notes"}
        </Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : null}
        </span>
      </div>
    </SectionCard>
  );
}
