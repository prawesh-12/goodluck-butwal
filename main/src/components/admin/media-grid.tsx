"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { describeMedia, deleteMedia } from "@/server/actions/media";

type Row = {
  id: string;
  kind: "static" | "cloudinary";
  type: string;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
  caption: string | null;
  folder: string;
};

// Static rows keep the path they always had. Cloudinary rows get the transform the plan sets.
function src(row: Row, width = 320) {
  if (row.kind === "static") return row.staticPath ?? "";
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${row.cloudinaryPublicId}`;
}

export function MediaGrid({
  rows,
  folders,
  total,
  missingAlt,
  page,
  pages,
  canDelete,
  canUpload,
}: {
  rows: Row[];
  folders: string[];
  total: number;
  missingAlt: number;
  page: number;
  pages: number;
  canDelete: boolean;
  canUpload: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`/admin/media?${next}`);
  };

  const onlyMissing = params.get("missing_alt") === "1";

  return (
    <>
      <form className="admin-filters" onSubmit={(e) => e.preventDefault()}>
        <label className="admin-field">
          <span className="t-small">Search</span>
          <input
            defaultValue={params.get("q") ?? ""}
            placeholder="Filename or alt text"
            onChange={(e) => set("q", e.target.value)}
          />
        </label>
        <label className="admin-field">
          <span className="t-small">Folder</span>
          <select defaultValue={params.get("folder") ?? ""} onChange={(e) => set("folder", e.target.value)}>
            <option value="">All</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span className="t-small">Type</span>
          <select defaultValue={params.get("type") ?? ""} onChange={(e) => set("type", e.target.value)}>
            <option value="">All</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </label>
        <button
          type="button"
          className="btn-black-sm"
          onClick={() => set("missing_alt", onlyMissing ? "" : "1")}
        >
          {onlyMissing ? "Show all" : `Needs alt text (${missingAlt})`}
        </button>
      </form>

      <p className="t-small admin-count">
        {total} files. {missingAlt === 0 ? "Every image has alt text." : `${missingAlt} images still need alt text.`}
      </p>
      {canUpload ? null : <p className="t-small admin-count">Your role cannot upload.</p>}
      {message ? <p role="alert" className="t-small admin-error">{message}</p> : null}

      {rows.length === 0 ? (
        <p className="t-body admin-empty">No files match. Clear the filters, or upload one.</p>
      ) : (
        <div className="admin-media-grid">
          {rows.map((row) => (
            <figure key={row.id} className="admin-media-tile">
              {row.type === "video" ? (
                <video src={src(row)} className="admin-media-thumb" muted />
              ) : (
                <img src={src(row)} alt={row.altText ?? ""} className="admin-media-thumb" loading="lazy" />
              )}
              <figcaption>
                <p className="t-small admin-media-name">{row.filename}</p>
                {row.type === "image" && !row.altText ? (
                  <p className="t-small admin-error">Needs alt text</p>
                ) : null}
                <button type="button" className="btn-black-sm" onClick={() => setOpen(open === row.id ? null : row.id)}>
                  {open === row.id ? "Close" : "Edit"}
                </button>
              </figcaption>

              {open === row.id ? (
                <form
                  className="admin-editor admin-media-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const result = await describeMedia({
                      id: row.id,
                      altText: form.get("altText"),
                      caption: form.get("caption"),
                    });
                    setMessage(result.ok ? "Saved." : result.error);
                    if (result.ok) router.refresh();
                  }}
                >
                  <label className="admin-field">
                    <span className="t-small">Alt text</span>
                    <input name="altText" defaultValue={row.altText ?? ""} placeholder="What the image shows" />
                  </label>
                  <label className="admin-field">
                    <span className="t-small">Caption</span>
                    <input name="caption" defaultValue={row.caption ?? ""} />
                  </label>
                  <div className="admin-actions">
                    <button type="submit" className="btn-black-sm">Save</button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-black-sm"
                        onClick={async () => {
                          const result = await deleteMedia({ id: row.id });
                          setMessage(result.ok ? "Deleted." : result.error);
                          if (result.ok) router.refresh();
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </figure>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="admin-pager">
          <span className="t-small">Page {page} of {pages}</span>
        </nav>
      ) : null}
    </>
  );
}
