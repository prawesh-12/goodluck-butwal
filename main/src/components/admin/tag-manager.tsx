"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, deleteTag, updateTag } from "@/server/actions/taxonomy";

export type TagRow = { id: string; slug: string; name: string };

export function TagManager({
  rows,
  canEdit,
  canDelete,
}: {
  rows: TagRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <NewTag />
      {rows.map((row) => (
        <TagEditor key={row.id} row={row} canEdit={canEdit} canDelete={canDelete} />
      ))}
    </>
  );
}

function NewTag() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await createTag({ name, slug: "" });
        setBusy(false);
        setMessage(result.ok ? "Added." : result.error);
        if (!result.ok) return;
        setName("");
        router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">Add a tag</h2>
      <label className="admin-field">
        <span className="t-small">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <span className="t-small admin-help">
          Tags sit at the foot of an article and gather related articles on one page.
        </span>
      </label>
      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || !name}>
          {busy ? "Adding" : "Add"}
        </button>
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}

function TagEditor({
  row,
  canEdit,
  canDelete,
}: {
  row: TagRow;
  canEdit: boolean;
  canDelete: boolean;
}) {
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
        const result = await updateTag({
          id: row.id,
          name: String(form.get("name") ?? ""),
          slug: String(form.get("slug") ?? ""),
        });
        setBusy(false);
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <label className="admin-field">
        <span className="t-small">Name</span>
        <input name="name" defaultValue={row.name} readOnly={!canEdit} />
        <span className="t-small admin-help">The word shown on the article.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Web address</span>
        <input name="slug" defaultValue={row.slug} readOnly={!canEdit} />
        <span className="t-small admin-help">The tag page lives at /news/tag/{row.slug}.</span>
      </label>

      <div className="admin-actions">
        {canEdit ? (
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? "Saving" : "Save"}
          </button>
        ) : null}

        {canDelete ? (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(`Delete the ${row.name} tag? It comes off every article using it.`)) return;
              setBusy(true);
              const result = await deleteTag({ id: row.id });
              setBusy(false);
              setMessage(result.ok ? "Deleted." : result.error);
              if (result.ok) router.refresh();
            }}
          >
            Delete
          </button>
        ) : null}

        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
