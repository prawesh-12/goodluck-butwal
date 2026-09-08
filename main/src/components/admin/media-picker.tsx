"use client";

import { useEffect, useState } from "react";

export type PickedMedia = {
  id: string;
  kind: "static" | "cloudinary";
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
};

export function mediaSrc(item: Pick<PickedMedia, "kind" | "staticPath" | "cloudinaryPublicId">, width = 320) {
  if (item.kind === "static") return item.staticPath ?? "";
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${item.cloudinaryPublicId}`;
}

// The only way to choose an image anywhere in the admin. There are no file inputs on any form,
// so every image is a media_assets row with alt text attached to it.
export function MediaPicker({
  label,
  name,
  value,
  help,
  onChange,
}: {
  label: string;
  name: string;
  value?: PickedMedia | null;
  help?: string;
  onChange?: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedMedia | null>(value ?? null);
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/admin/media/search?q=${encodeURIComponent(q)}`);
      const body = (await res.json()) as { ok: boolean; data?: PickedMedia[] };
      setItems(body.data ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [open, q]);

  const choose = (item: PickedMedia | null) => {
    setPicked(item);
    setOpen(false);
    onChange?.(item?.id ?? null);
  };

  return (
    <div className="admin-field">
      <span className="t-small">{label}</span>
      <input type="hidden" name={name} value={picked?.id ?? ""} readOnly />

      <div className="admin-picker-current">
        {picked ? (
          <>
            <img src={mediaSrc(picked)} alt={picked.altText ?? ""} className="admin-picker-thumb" />
            <div>
              <p className="t-small">{picked.filename}</p>
              {picked.altText ? null : <p className="t-small admin-error">This image has no alt text yet.</p>}
            </div>
          </>
        ) : (
          <p className="t-small admin-empty">Nothing chosen.</p>
        )}

        <div className="admin-actions">
          <button type="button" className="btn-black-sm" onClick={() => setOpen(true)}>
            {picked ? "Change" : "Choose"}
          </button>
          {picked ? (
            <button type="button" className="btn-black-sm" onClick={() => choose(null)}>
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {help ? <span className="t-small admin-help">{help}</span> : null}

      {open ? (
        <div role="dialog" aria-label={`Choose ${label}`} className="admin-picker-dialog">
          <div className="admin-picker-panel">
            <div className="admin-picker-head">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by filename or alt text"
              />
              <button type="button" className="btn-black-sm" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            {loading ? (
              <p className="t-small admin-empty">Looking.</p>
            ) : items.length === 0 ? (
              <p className="t-small admin-empty">Nothing matches. Upload it in Media first.</p>
            ) : (
              <div className="admin-picker-grid">
                {items.map((item) => (
                  <button key={item.id} type="button" className="admin-picker-item" onClick={() => choose(item)}>
                    <img src={mediaSrc(item)} alt={item.altText ?? ""} />
                    <span className="t-small">{item.filename}</span>
                    {item.altText ? null : <span className="t-small admin-error">No alt text</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
