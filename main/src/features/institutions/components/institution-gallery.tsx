"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { SectionCard } from "@/components/shared/admin/editor-shell";
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
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
    if (saved) router.refresh();
  };

  return (
    <form onSubmit={save}>
      <SectionCard title="Gallery" description="The pictures that scroll across the institution page.">
        <Repeater<Row>
          label="Pictures"
          items={items}
          blank={() => ({ uid: crypto.randomUUID(), mediaId: "", caption: "", media: null })}
          onChange={setItems}
          addLabel="Add a picture"
          emptyLabel="No pictures yet."
        >
          {(item, update, index) => (
            <>
              <MediaPicker
                key={item.uid}
                label={`Picture ${index + 1}`}
                name={`gallery-${index}`}
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
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {busy ? "Saving..." : "Save gallery"}
            </Button>
          </div>
        ) : null}
      </SectionCard>
    </form>
  );
}
