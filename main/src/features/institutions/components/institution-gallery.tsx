"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { Field, SaveBar } from "@/components/shared/admin/repeater";
import { saveInstitutionGallery } from "@/features/institutions/actions";

export type GalleryItem = {
  id?: string;
  mediaId: string;
  caption: string;
  media: PickedMedia | null;
};

// Order here is the order the pictures scroll past on the institution page.
export function InstitutionGallery({
  institutionId,
  rows,
  canEdit,
}: {
  institutionId: string;
  rows: GalleryItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(rows);
  const [dragging, setDragging] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const update = (index: number, patch: Partial<GalleryItem>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const dropOn = (target: number) => {
    if (dragging === null || dragging === target) return;
    setItems((current) => {
      const next = [...current];
      next.splice(target, 0, next.splice(dragging, 1)[0]);
      return next;
    });
    setDragging(null);
  };

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await saveInstitutionGallery({
          institutionId,
          items: items
            .filter((item) => item.mediaId)
            .map((item) => ({ id: item.id, mediaId: item.mediaId, caption: item.caption })),
        });
        setBusy(false);
        setProblems(result.ok ? [] : Object.values(result.fieldErrors ?? {}).flat());
        setMessage(result.ok ? "Gallery saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <h2 className="t-h5 admin-subhead">Gallery</h2>
      <p className="t-small admin-help">
        The pictures that scroll across the institution page under the description. Drag a picture
        to change the order.
      </p>

      {items.length === 0 ? (
        <p className="t-small admin-empty">No pictures yet. Add the first one below.</p>
      ) : null}

      {items.map((item, index) => (
        <div
          key={item.id ?? `new-${index}`}
          className="admin-tile"
          draggable={canEdit}
          onDragStart={() => setDragging(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOn(index)}
          onDragEnd={() => setDragging(null)}
        >
          <MediaPicker
            label={`Picture ${index + 1}`}
            name={`gallery-${index}`}
            value={item.media}
            help="Chosen from the media library, where its alt text lives."
            onChange={(mediaId) => update(index, { mediaId: mediaId ?? "" })}
          />
          <Field
            label="Caption"
            help="The line under the picture. Leave it empty for no caption."
            value={item.caption}
            onChange={(caption) => update(index, { caption })}
          />
          {canEdit ? (
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ))}

      {canEdit ? (
        <>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn"
              onClick={() => setItems((current) => [...current, { mediaId: "", caption: "", media: null }])}
            >
              Add a picture
            </button>
          </div>
          <SaveBar busy={busy} message={message} problems={problems} />
        </>
      ) : null}
    </form>
  );
}
