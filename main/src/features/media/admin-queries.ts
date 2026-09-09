import { eq, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import type { PickedMedia } from "@/features/media/components/media-picker";

// The picker needs the whole row to show a thumbnail for an image already attached.
export async function pickedMedia(ids: (string | null | undefined)[]): Promise<Record<string, PickedMedia>> {
  const wanted = [...new Set(ids.filter(Boolean) as string[])];
  if (wanted.length === 0) return {};

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

  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

export async function mediaAlt(ids: (string | null | undefined)[]) {
  const wanted = [...new Set(ids.filter(Boolean) as string[])];
  if (wanted.length === 0) return new Map<string, string | null>();

  const rows = await db
    .select({ id: mediaAssets.id, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, wanted));
  return new Map(rows.map((row) => [row.id, row.altText]));
}

export async function mediaIdByPath(path: string) {
  if (!path) return null;
  // Static rows are stored by path, Cloudinary ones by public id, which sits inside the URL.
  const publicId = path.match(/\/upload\/[^/]+\/(.+)$/)?.[1];
  const [row] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(publicId ? eq(mediaAssets.cloudinaryPublicId, publicId) : eq(mediaAssets.staticPath, path));
  return row?.id ?? null;
}

export async function pickedMediaMap(ids: (string | null | undefined)[]) {
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
