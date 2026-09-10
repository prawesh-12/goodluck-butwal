"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/utils/media-url";

export type PickedMedia = {
  id: string;
  kind: "static" | "cloudinary";
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
};

// The only way to choose an image in the admin. No form has a file input, so every image is a
// media_assets row with alt text attached.
export function MediaPicker({
  label,
  name,
  value,
  help,
  type,
  onChange,
}: {
  label: string;
  name: string;
  value?: PickedMedia | null;
  help?: string;
  type?: "image" | "video";
  onChange?: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedMedia | null>(value ?? null);
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Waits for a pause in typing, and ignores a reply that lands after the dialog closed.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(
        `/api/admin/media/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ""}`,
      );
      const body = (await res.json()) as { ok: boolean; data?: PickedMedia[] };
      if (cancelled) return;
      setItems(body.data ?? []);
      setLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, q, type]);

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
            {type === "video" ? (
              <video src={mediaUrl(picked, 320)} className="admin-picker-thumb" muted />
            ) : (
              <img src={mediaUrl(picked, 320)} alt={picked.altText ?? ""} className="admin-picker-thumb" />
            )}
            <div>
              <p className="t-small">{picked.filename}</p>
              {type === "video" || picked.altText ? null : (
                <p className="t-small admin-error">This image has no alt text yet.</p>
              )}
            </div>
          </>
        ) : (
          <p className="t-small admin-empty">Nothing chosen.</p>
        )}

        <div className="admin-actions">
          <button type="button" className="admin-btn" onClick={() => setOpen(true)}>
            {picked ? "Change" : "Choose"}
          </button>
          {picked ? (
            <button type="button" className="admin-btn" onClick={() => choose(null)}>
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
              <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            {loading ? (
              <p className="t-small admin-empty">Looking.</p>
            ) : items.length === 0 ? (
              <p className="t-small admin-empty">
                Nothing matches. Upload it in {type === "video" ? "Videos" : "Images"} first.
              </p>
            ) : (
              <div className="admin-picker-grid">
                {items.map((item) => (
                  <button key={item.id} type="button" className="admin-picker-item" onClick={() => choose(item)}>
                    {type === "video" ? (
                      <video src={mediaUrl(item, 320)} className="admin-media-thumb" muted />
                    ) : (
                      <img src={mediaUrl(item, 320)} alt={item.altText ?? ""} />
                    )}
                    <span className="t-small">{item.filename}</span>
                    {type === "video" || item.altText ? null : (
                      <span className="t-small admin-error">No alt text</span>
                    )}
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
