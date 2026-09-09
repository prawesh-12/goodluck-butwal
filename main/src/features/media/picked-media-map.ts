import { inArray } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";

export async function pickedMedia(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => Boolean(id));
  if (wanted.length === 0) return new Map<string, PickedRow>();

  const rows = await db
    .select({
      id: mediaAssets.id,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      filename: mediaAssets.filename,
      altText: mediaAssets.altText,
    })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, wanted));

  return new Map(rows.map((row) => [row.id, row]));
}

type PickedRow = {
  id: string;
  kind: "static" | "cloudinary";
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
};
