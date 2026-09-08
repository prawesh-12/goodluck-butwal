import { and, asc, count, eq, ilike, inArray, like, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import {
  destinationFaqs,
  destinations,
  mediaAssets,
  pages,
  serviceFaqs,
  services,
  uiStrings,
} from "@db/schema";
import type { PickedMedia } from "@/components/admin/media-picker";

export const PAGE_SIZE = 25;

export type ContentFilters = {
  q?: string;
  status?: string;
  parent?: string;
  scope?: string;
  page?: number;
};

function pageOf(f: ContentFilters) {
  return Math.max(1, f.page ?? 1);
}

function combine(parts: (SQL | undefined)[]) {
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminPages(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(pages.title, `%${f.q}%`), ilike(pages.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(pages.status, f.status as "draft") : undefined,
    f.parent ? eq(pages.parent, f.parent) : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: pages.id,
        slug: pages.slug,
        parent: pages.parent,
        title: pages.title,
        status: pages.status,
        showInNav: pages.showInNav,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(where)
      .orderBy(asc(pages.parent), asc(pages.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(pages).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminPage(id: string) {
  const [row] = await db.select().from(pages).where(eq(pages.id, id));
  return row;
}

export async function listAdminDestinations(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(destinations.name, `%${f.q}%`), ilike(destinations.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(destinations.status, f.status as "draft") : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: destinations.id,
        slug: destinations.slug,
        name: destinations.name,
        status: destinations.status,
        hasPage: destinations.hasPage,
        isFeatured: destinations.isFeatured,
        updatedAt: destinations.updatedAt,
      })
      .from(destinations)
      .where(where)
      .orderBy(asc(destinations.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(destinations).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminDestination(id: string) {
  const [row] = await db.select().from(destinations).where(eq(destinations.id, id));
  return row;
}

export async function listAdminServices(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(services.name, `%${f.q}%`), ilike(services.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(services.status, f.status as "draft") : undefined,
    f.scope ? eq(services.officeScope, f.scope as "both") : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        category: services.category,
        officeScope: services.officeScope,
        tone: services.tone,
        status: services.status,
        updatedAt: services.updatedAt,
      })
      .from(services)
      .where(where)
      .orderBy(asc(services.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(services).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminService(id: string) {
  const [row] = await db.select().from(services).where(eq(services.id, id));
  return row;
}

export async function listDestinationFaqs(destinationId: string) {
  return db
    .select({
      id: destinationFaqs.id,
      question: destinationFaqs.question,
      answerHtml: destinationFaqs.answerHtml,
    })
    .from(destinationFaqs)
    .where(eq(destinationFaqs.destinationId, destinationId))
    .orderBy(asc(destinationFaqs.sortOrder));
}

export async function listServiceFaqs(serviceId: string) {
  return db
    .select({ id: serviceFaqs.id, question: serviceFaqs.question, answerHtml: serviceFaqs.answerHtml })
    .from(serviceFaqs)
    .where(eq(serviceFaqs.serviceId, serviceId))
    .orderBy(asc(serviceFaqs.sortOrder));
}

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

export async function uiStringsFor(prefix: string) {
  const rows = await db
    .select({ key: uiStrings.key, value: uiStrings.value })
    .from(uiStrings)
    .where(like(uiStrings.key, `${prefix}%`));
  return new Map(rows.map((row) => [row.key, row.value]));
}

export async function slugsInUse(table: "pages" | "destinations" | "services", exceptId?: string) {
  const rows =
    table === "pages"
      ? await db.select({ id: pages.id, slug: pages.slug }).from(pages)
      : table === "destinations"
        ? await db.select({ id: destinations.id, slug: destinations.slug }).from(destinations)
        : await db.select({ id: services.id, slug: services.slug }).from(services);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}
