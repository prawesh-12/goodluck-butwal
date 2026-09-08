"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCourseCategory,
  deleteCourseCategory,
  reorderCourseCategories,
  updateCourseCategory,
} from "@/server/actions/course-categories";

export type CourseCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  courses: number;
};

export function CourseCategoryManager({
  rows,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: CourseCategoryRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(rows);
  const [name, setName] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const moved = order.some((row, i) => row.id !== rows[i]?.id);

  const dropOn = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    setOrder((current) => {
      const next = [...current];
      const from = next.findIndex((row) => row.id === dragging);
      const to = next.findIndex((row) => row.id === targetId);
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  const run = async (work: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    setBusy(true);
    const result = await work();
    setBusy(false);
    setMessage(result.ok ? done : (result.error ?? "That did not work."));
    if (result.ok) router.refresh();
    return result.ok;
  };

  return (
    <>
      {canCreate ? (
        <form
          className="admin-editor"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(
              () => createCourseCategory({ name, slug: "", sortOrder: order.length }),
              "Added.",
            );
            if (ok) setName("");
          }}
        >
          <label className="admin-field">
            <span className="t-small">Add a subject area</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
            <span className="t-small admin-help">
              The label on a course card and one of the choices in the course filters. The web
              address is made from the name.
            </span>
          </label>
          <div className="admin-actions">
            <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || !name.trim()}>
              {busy ? "Adding" : "Add"}
            </button>
          </div>
        </form>
      ) : null}

      {order.length === 0 ? (
        <p className="t-body admin-empty">
          No subject areas yet. Add the first one above, then courses can be filed under it.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Courses</th>
              <th>On the site</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {order.map((row) => (
              <tr
                key={row.id}
                draggable={canEdit}
                onDragStart={() => setDragging(row.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(row.id)}
                onDragEnd={() => setDragging(null)}
              >
                <td>
                  {canEdit ? (
                    <input
                      defaultValue={row.name}
                      aria-label={`Name of ${row.name}`}
                      onBlur={async (event) => {
                        const next = event.target.value.trim();
                        if (!next || next === row.name) return;
                        await run(
                          () => updateCourseCategory({ id: row.id, name: next, slug: "", sortOrder: row.sortOrder }),
                          "Saved.",
                        );
                      }}
                    />
                  ) : (
                    row.name
                  )}
                </td>
                <td>/courses?category={row.slug}</td>
                <td>{row.courses}</td>
                <td>
                  <a href={`/courses?category=${row.slug}`} target="_blank" rel="noreferrer">
                    View on site
                  </a>
                </td>
                <td>
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`Delete the ${row.name} subject area?`)) return;
                        await run(() => deleteCourseCategory({ id: row.id }), "Deleted.");
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canEdit ? (
        <div className="admin-actions">
          <span className="t-small admin-help">
            Drag a row to change the order the subject areas appear in the course filters. Edit a
            name in place, it saves when you click away.
          </span>
          {moved ? (
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={() =>
                run(() => reorderCourseCategories({ ids: order.map((row) => row.id) }), "Order saved.")
              }
            >
              {busy ? "Saving" : "Save order"}
            </button>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="t-small">{message}</p> : null}
    </>
  );
}
