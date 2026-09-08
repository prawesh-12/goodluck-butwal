"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEnquiry } from "@/server/actions/leads";
import { Select } from "./repeater";

const STATUSES = ["new", "in_progress", "contacted", "converted", "closed", "spam"];

export function EnquiryEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="admin-editor"
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
      <h2 className="t-h5 admin-subhead">Handling</h2>

      <Select
        label="Status"
        name="status"
        defaultValue={status}
        options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
      />

      <label className="admin-field">
        <span className="t-small">Internal notes</span>
        <textarea name="internalNotes" defaultValue={notes} rows={4} />
      </label>

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
