import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@goodluck/db";
import {
  courses,
  events,
  institutionImages,
  institutions,
  mediaAssets,
  partners,
  posts,
  teamMembers,
  testPrepCourses,
} from "@goodluck/db/schema";
import { assetId } from "@/lib/utils/media-url";
import {
  imageUrl,
  searchAssets,
  videoPosterUrl,
  videoStreamUrl,
  type CloudinaryAsset,
  type ResourceType,
} from "@/lib/integrations/cloudinary";

const PAGE_SIZE = 48;

// The reference row a CMS section points at. Everything else about the asset comes from
// Cloudinary, so this carries only what the picker and the publish checks need.
export type ReferenceRow = {
  id: string;
  kind: "static" | "cloudinary";
  altText: string | null;
  caption: string | null;
};

// The delivery URLs are built here so the browsing UI never imports the module that holds the
// Cloudinary credentials.
export type LibraryAsset = CloudinaryAsset & {
  reference: ReferenceRow | null;
  thumbUrl: string;
  viewUrl: string;
};

// A static row mirrors a file in public/ and is keyed by path. assetId turns that path into the
// public id Cloudinary serves it under, which is where the two sides meet.
function keyOf(row: { staticPath: string | null; cloudinaryPublicId: string | null }) {
  return row.cloudinaryPublicId ?? (row.staticPath ? assetId(row.staticPath) : null);
}

// Cloudinary folders the asset under goodluck/<folder>/<name>. The row keeps the short name.
export function folderOf(publicId: string) {
  const parts = publicId.split("/");
  return parts.length > 1 ? parts[parts.length - 2] : "general";
}

async function referenceRows(resourceType: ResourceType) {
  const rows = await db
    .select({
      id: mediaAssets.id,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      altText: mediaAssets.altText,
      caption: mediaAssets.caption,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.type, resourceType));

  const byPublicId = new Map<string, ReferenceRow>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key) byPublicId.set(key, { id: row.id, kind: row.kind, altText: row.altText, caption: row.caption });
  }
  return byPublicId;
}

// Cloudinary is the source of truth for what exists. Postgres is asked only for the reference
// rows, so browsing never scans a table for the asset list itself.
export async function listLibrary(opts: { resourceType: ResourceType; q?: string; cursor?: string }) {
  const [page, references] = await Promise.all([
    searchAssets({ ...opts, limit: PAGE_SIZE }),
    referenceRows(opts.resourceType),
  ]);

  const video = opts.resourceType === "video";
  const assets: LibraryAsset[] = page.assets.map((asset) => ({
    ...asset,
    reference: references.get(asset.publicId) ?? null,
    thumbUrl: video ? videoPosterUrl(asset.publicId) : imageUrl(asset.publicId, 320),
    viewUrl: video ? videoStreamUrl(asset.publicId) : imageUrl(asset.publicId, 1280),
  }));
  return { assets, total: page.total, cursor: page.cursor };
}

export type AssetRow = {
  id: string;
  kind: "static" | "cloudinary";
  officeId: string | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
};

// Cloudinary knows an asset by public id, the CMS knows it by a media_assets uuid. A static row
// is matched on the path it was seeded from, which no index can express, so SQL narrows the set
// on the filename and the exact match is made here.
export async function assetByPublicId(publicId: string, resourceType: ResourceType): Promise<AssetRow | null> {
  const tail = publicId.split("/").pop() ?? publicId;
  const rows = await db
    .select({
      id: mediaAssets.id,
      kind: mediaAssets.kind,
      officeId: mediaAssets.officeId,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.type, resourceType),
        or(eq(mediaAssets.cloudinaryPublicId, publicId), ilike(mediaAssets.staticPath, `%${tail}%`)),
      ),
    );

  return rows.find((row) => keyOf(row) === publicId) ?? null;
}

// Every column in the seven CMS sections that points at media_assets, with the label an admin
// would recognise.
// Each reference is one column somewhere that points at a media row. `find` names what is using
// one asset; `findMany` answers the same question for a page of them in a single query.
// Each reference is one column somewhere that points at a media row. `findMany` answers
// "what is using these" for a whole page of assets in one query per reference.
const REFERENCES: {
  kind: string;
  findMany: (ids: string[]) => Promise<{ id: string | null; label: string | null }[]>;
}[] = [
  {
    kind: "Team member",
    findMany: (ids) =>
      db.select({ id: teamMembers.photoId, label: teamMembers.fullName }).from(teamMembers).where(inArray(teamMembers.photoId, ids)),
  },
  {
    kind: "Partner logo",
    findMany: (ids) =>
      db.select({ id: partners.logoId, label: partners.name }).from(partners).where(inArray(partners.logoId, ids)),
  },
  {
    kind: "News banner",
    findMany: (ids) =>
      db.select({ id: posts.bannerImageId, label: posts.title }).from(posts).where(inArray(posts.bannerImageId, ids)),
  },
  {
    kind: "Event cover",
    findMany: (ids) =>
      db.select({ id: events.coverImageId, label: events.title }).from(events).where(inArray(events.coverImageId, ids)),
  },
  {
    kind: "Institution logo",
    findMany: (ids) =>
      db.select({ id: institutions.logoId, label: institutions.name }).from(institutions).where(inArray(institutions.logoId, ids)),
  },
  {
    kind: "Test preparation hero",
    findMany: (ids) =>
      db
        .select({ id: testPrepCourses.heroImageId, label: testPrepCourses.name })
        .from(testPrepCourses)
        .where(inArray(testPrepCourses.heroImageId, ids)),
  },
  {
    kind: "Institution gallery",
    findMany: (ids) =>
      db
        .select({ id: institutionImages.mediaId, label: institutions.name })
        .from(institutionImages)
        .innerJoin(institutions, eq(institutionImages.institutionId, institutions.id))
        .where(inArray(institutionImages.mediaId, ids)),
  },
];

// Rich text embeds an asset by URL, and every one of those URLs carries the public id.
const RICH_TEXT: ((like: string) => Promise<{ n: number }[]>)[] = [
  (like) => db.select({ n: count() }).from(posts).where(sql`${posts.bodyHtml} like ${like}`),
  (like) => db.select({ n: count() }).from(events).where(sql`${events.descriptionHtml} like ${like}`),
  (like) => db.select({ n: count() }).from(institutions).where(sql`${institutions.descriptionHtml} like ${like}`),
  (like) => db.select({ n: count() }).from(courses).where(sql`${courses.descriptionHtml} like ${like}`),
  (like) => db.select({ n: count() }).from(courses).where(sql`${courses.entryRequirementsHtml} like ${like}`),
];

export type Usage = { kind: string; label: string };

// What is using these assets, for a whole page at once: one query per reference rather than one
// per card. The library needs it for every card, and the delete guard needs it for one.
export async function usageFor(ids: string[]): Promise<Map<string, Usage[]>> {
  const found = new Map<string, Usage[]>();
  if (ids.length === 0) return found;

  for (const ref of REFERENCES) {
    for (const row of await ref.findMany(ids)) {
      if (!row.id) continue;
      const list = found.get(row.id) ?? [];
      list.push({ kind: ref.kind, label: row.label ?? "Untitled" });
      found.set(row.id, list);
    }
  }
  return found;
}

// Delete is blocked while an asset is in use, and the answer names what is using it.
export async function findUsage(id: string): Promise<Usage[]> {
  return (await usageFor([id])).get(id) ?? [];
}

export async function findInRichText(publicId: string) {
  let total = 0;
  for (const body of RICH_TEXT) {
    const [row] = await body(`%${publicId}%`);
    total += row.n;
  }
  return total;
}
