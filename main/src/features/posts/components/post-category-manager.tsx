"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPostCategory,
  deletePostCategory,
  updatePostCategory,
} from "@/features/posts/taxonomy-actions";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  posts: number;
};

export function PostCategoryManager({
  rows,
  canEdit,
  canDelete,
}: {
  rows: CategoryRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <NewCategory />
      {rows.map((row) => (
        <CategoryEditor key={row.id} row={row} canEdit={canEdit} canDelete={canDelete} />
      ))}
    </>
  );
}

function NewCategory() {
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
        const result = await createPostCategory({ name, slug: "", description: "", sortOrder: 0 });
        setBusy(false);
        setMessage(result.ok ? "Added." : result.error);
        if (!result.ok) return;
        setName("");
        router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">Add a category</h2>
      <label className="admin-field">
        <span className="t-small">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <span className="t-small admin-help">
          The label on a news card and the heading on its own news page. The web address is made
          from the name.
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

function CategoryEditor({
  row,
  canEdit,
  canDelete,
}: {
  row: CategoryRow;
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
        const result = await updatePostCategory({
          id: row.id,
          name: String(form.get("name") ?? ""),
          slug: String(form.get("slug") ?? ""),
          description: String(form.get("description") ?? ""),
          sortOrder: Number(form.get("sortOrder") ?? 0),
        });
        setBusy(false);
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">{row.name}</h2>
      <p className="t-small admin-help">
        {row.posts} {row.posts === 1 ? "post" : "posts"} use this category.
      </p>

      <label className="admin-field">
        <span className="t-small">Name</span>
        <input name="name" defaultValue={row.name} readOnly={!canEdit} />
        <span className="t-small admin-help">The label on the news card.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Web address</span>
        <input name="slug" defaultValue={row.slug} readOnly={!canEdit} />
        <span className="t-small admin-help">The category page lives at /news/category/{row.slug}.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Description</span>
        <input name="description" defaultValue={row.description ?? ""} readOnly={!canEdit} />
        <span className="t-small admin-help">The sentence under the heading on the category page.</span>
      </label>

      <label className="admin-field">
        <span className="t-small">Order</span>
        <input name="sortOrder" type="number" min={0} defaultValue={row.sortOrder} readOnly={!canEdit} />
        <span className="t-small admin-help">Lower numbers come first in the news filter.</span>
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
              if (!window.confirm(`Delete the ${row.name} category?`)) return;
              setBusy(true);
              const result = await deletePostCategory({ id: row.id });
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
