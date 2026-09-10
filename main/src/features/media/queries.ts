import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@db/client";
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
} from "@db/schema";
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
const REFERENCES: { kind: string; find: (id: string) => Promise<{ label: string | null }[]> }[] = [
  { kind: "Team member", find: (id) => db.select({ label: teamMembers.fullName }).from(teamMembers).where(eq(teamMembers.photoId, id)).limit(5) },
  { kind: "Partner logo", find: (id) => db.select({ label: partners.name }).from(partners).where(eq(partners.logoId, id)).limit(5) },
  { kind: "News banner", find: (id) => db.select({ label: posts.title }).from(posts).where(eq(posts.bannerImageId, id)).limit(5) },
  { kind: "Event cover", find: (id) => db.select({ label: events.title }).from(events).where(eq(events.coverImageId, id)).limit(5) },
  { kind: "Institution logo", find: (id) => db.select({ label: institutions.name }).from(institutions).where(eq(institutions.logoId, id)).limit(5) },
  { kind: "Test preparation hero", find: (id) => db.select({ label: testPrepCourses.name }).from(testPrepCourses).where(eq(testPrepCourses.heroImageId, id)).limit(5) },
  {
    kind: "Institution gallery",
    find: (id) =>
      db
        .select({ label: institutions.name })
        .from(institutionImages)
        .innerJoin(institutions, eq(institutionImages.institutionId, institutions.id))
        .where(eq(institutionImages.mediaId, id))
        .limit(5),
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

// Delete is blocked while an asset is in use, and the answer names what is using it.
export async function findUsage(id: string): Promise<Usage[]> {
  const found: Usage[] = [];
  for (const ref of REFERENCES) {
    for (const row of await ref.find(id)) found.push({ kind: ref.kind, label: row.label ?? "Untitled" });
  }
  return found;
}

export async function findInRichText(publicId: string) {
  let total = 0;
  for (const body of RICH_TEXT) {
    const [row] = await body(`%${publicId}%`);
    total += row.n;
  }
  return total;
}
