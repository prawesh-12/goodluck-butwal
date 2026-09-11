"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Repeater } from "@/components/shared/admin/repeater";
import { TextField } from "@/components/shared/admin/fields";
import { useAction } from "@/components/shared/admin/use-action";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { saveInstitutionGallery } from "@/features/institutions/actions";

export type GalleryItem = {
  id?: string;
  mediaId: string;
  caption: string;
  media: PickedMedia | null;
};

// The picker keeps the chosen picture in its own state, so each row needs an identity that
// survives a move or the previews follow the position rather than the row.
type Row = GalleryItem & { uid: string };

// Sits inside the institution editor's Media section but keeps its own save, because the pictures
// go through a separate action and one form cannot hold another.
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
  const { busy, run } = useAction();
  const [items, setItems] = useState<Row[]>(() =>
    rows.map((row, index) => ({ ...row, uid: row.id ?? `row-${index}` })),
  );
  const [dirty, setDirty] = useState(false);

  const change = (next: Row[]) => {
    setItems(next);
    setDirty(true);
  };

  const save = async () => {
    const saved = await run(
      () =>
        saveInstitutionGallery({
          institutionId,
          items: items
            .filter((item) => item.mediaId)
            .map((item) => ({ id: item.id, mediaId: item.mediaId, caption: item.caption })),
        }),
      { success: "Gallery saved", failure: "Couldn't save the gallery." },
    );
    if (!saved) return;
    setDirty(false);
    router.refresh();
  };

  return (
    <div className="space-y-4 border-t border-border pt-5">
      <Repeater<Row>
        label="Gallery"
        help="The pictures that scroll across the institution page. They save on their own, below."
        items={items}
        blank={() => ({ uid: crypto.randomUUID(), mediaId: "", caption: "", media: null })}
        onChange={change}
        addLabel="Add a picture"
        emptyLabel="No pictures yet."
      >
        {(item, update, index) => (
          <>
            <MediaPicker
              key={item.uid}
              label={`Picture ${index + 1}`}
              name={`gallery-${index}`}
              required
              value={item.media}
              type="image"
              onChange={(mediaId) => update({ mediaId: mediaId ?? "" })}
            />
            <TextField
              label="Caption"
              value={item.caption}
              onChange={(caption) => update({ caption })}
            />
          </>
        )}
      </Repeater>

      {canEdit ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {busy ? "Saving the gallery..." : dirty ? "Gallery not saved yet" : "Gallery saved"}
          </span>
          <Button type="button" variant="outline" disabled={busy || !dirty} onClick={save}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Save gallery
          </Button>
        </div>
      ) : null}
    </div>
  );
}
