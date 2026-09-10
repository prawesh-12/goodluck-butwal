import { and, count, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import {
  destinations,
  mediaAssets,
  offices,
  pages,
  posts,
  services,
  teamMembers,
} from "@db/schema";

export const PAGE_SIZE = 48;

export type MediaFilters = {
  q?: string;
  folder?: string;
  type?: string;
  kind?: string;
  missing_alt?: string;
  page?: number;
};

function where(f: MediaFilters) {
  const parts: (SQL | undefined)[] = [];
  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(mediaAssets.filename, like), ilike(mediaAssets.altText, like)));
  }
  if (f.folder) parts.push(eq(mediaAssets.folder, f.folder));
  if (f.type) parts.push(eq(mediaAssets.type, f.type));
  if (f.kind) parts.push(eq(mediaAssets.kind, f.kind as "static"));
  // Null means nobody has described it yet. An empty string is a deliberate decorative image.
  if (f.missing_alt === "1") {
    parts.push(and(eq(mediaAssets.type, "image"), isNull(mediaAssets.altText)));
  }
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listMedia(f: MediaFilters) {
  const clause = where(f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total], [missing], folders] = await Promise.all([
    db
      .select()
      .from(mediaAssets)
      .where(clause)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(mediaAssets).where(clause),
    db
      .select({ n: count() })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.type, "image"), isNull(mediaAssets.altText))),
    db
      .selectDistinct({ folder: mediaAssets.folder })
      .from(mediaAssets)
      .orderBy(mediaAssets.folder),
  ]);

  return { rows, total: total.n, missingAlt: missing.n, page, folders: folders.map((f) => f.folder) };
}

// Every column that points at media_assets, with the label an admin would recognise.
const REFERENCES = [
  { table: offices, column: offices.heroImageId, label: offices.name, kind: "Office" },
  { table: teamMembers, column: teamMembers.photoId, label: teamMembers.fullName, kind: "Team member" },
  { table: pages, column: pages.heroImageId, label: pages.title, kind: "Page" },
  { table: destinations, column: destinations.heroImageId, label: destinations.name, kind: "Destination hero" },
  { table: destinations, column: destinations.cardImageId, label: destinations.name, kind: "Destination card" },
  { table: destinations, column: destinations.flagImageId, label: destinations.name, kind: "Destination flag" },
  { table: services, column: services.artworkId, label: services.name, kind: "Service artwork" },
  { table: services, column: services.reelId, label: services.name, kind: "Service reel" },
  { table: posts, column: posts.bannerImageId, label: posts.title, kind: "Post banner" },
] as const;

export type Usage = { kind: string; label: string };

// Delete is blocked while an asset is in use, and the answer names what is using it.
export async function findUsage(id: string): Promise<Usage[]> {
  const found: Usage[] = [];
  for (const ref of REFERENCES) {
    const rows = await db
      .select({ label: ref.label })
      .from(ref.table)
      .where(eq(ref.column, id))
      .limit(5);
    for (const row of rows) found.push({ kind: ref.kind, label: row.label ?? "Untitled" });
  }
  return found;
}

// Rich text embeds an image by URL rather than by id, so those are found by searching the html.
export async function findInRichText(path: string) {
  const [row] = await db
    .select({ n: count() })
    .from(posts)
    .where(sql`${posts.bodyHtml} like ${`%${path}%`}`);
  return row.n;
}
