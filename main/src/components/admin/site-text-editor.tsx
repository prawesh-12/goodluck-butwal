"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUiString } from "@/server/actions/site-text";

export type SiteTextRow = { key: string; value: string; label: string | null; help: string | null };
export type SiteTextGroup = { name: string; rows: SiteTextRow[] };

export function SiteTextEditor({ groups }: { groups: SiteTextGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <section key={group.name}>
          <h2 className="t-h5 admin-subhead">{group.name.charAt(0).toUpperCase() + group.name.slice(1)}</h2>
          {group.rows.map((row) => (
            <StringRow key={row.key} row={row} />
          ))}
        </section>
      ))}
    </>
  );
}

function StringRow({ row }: { row: SiteTextRow }) {
  const router = useRouter();
  const [value, setValue] = useState(row.value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await updateUiString({ key: row.key, value });
        setBusy(false);
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        if (result.note) {
          setValue(row.value);
          setMessage(result.note);
          return;
        }
        setMessage("Saved.");
        router.refresh();
      }}
    >
      <label className="admin-field">
        <span className="t-small">{row.label ?? row.key}</span>
        <input value={value} onChange={(event) => setValue(event.target.value)} />
      </label>

      {row.help ? <span className="t-small">{row.help}</span> : null}

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || value === row.value}>
          {busy ? "Saving" : "Save"}
        </button>
        <span className="t-small">{value.length} characters</span>
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
