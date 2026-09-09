import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@db/client";
import { courses, destinations, institutionImages, institutions, mediaAssets, partners } from "@db/schema";
import { combine, pageOf, PAGE_SIZE, type CatalogueFilters } from "@/lib/utils/admin-query";
import type { PickedMedia } from "@/features/media/components/media-picker";

export async function listAdminInstitutions(f: CatalogueFilters) {
  const where = combine([
    f.q
      ? or(
          ilike(institutions.name, `%${f.q}%`),
          ilike(institutions.slug, `%${f.q}%`),
          ilike(institutions.country, `%${f.q}%`),
        )
      : undefined,
    f.status ? eq(institutions.status, f.status as "draft") : undefined,
    f.destination ? eq(institutions.destinationId, f.destination) : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: institutions.id,
        slug: institutions.slug,
        name: institutions.name,
        country: institutions.country,
        city: institutions.city,
        destination: destinations.name,
        isPartner: institutions.isPartner,
        isFeatured: institutions.isFeatured,
        status: institutions.status,
      })
      .from(institutions)
      .leftJoin(destinations, eq(destinations.id, institutions.destinationId))
      .where(where)
      .orderBy(asc(institutions.sortOrder), asc(institutions.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(institutions).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminInstitution(id: string) {
  const [row] = await db.select().from(institutions).where(eq(institutions.id, id));
  return row;
}

export async function institutionSlugs(exceptId?: string) {
  const rows = await db.select({ id: institutions.id, slug: institutions.slug }).from(institutions);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}

export async function institutionOptions() {
  return db
    .select({ id: institutions.id, name: institutions.name, destinationId: institutions.destinationId })
    .from(institutions)
    .orderBy(asc(institutions.name));
}

export async function coursesPerInstitution() {
  const rows = await db
    .select({ institutionId: courses.institutionId, n: count() })
    .from(courses)
    .groupBy(courses.institutionId);
  return new Map(rows.map((row) => [row.institutionId, row.n]));
}

export async function courseCountFor(institutionId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(courses)
    .where(eq(courses.institutionId, institutionId));
  return row.n;
}

export type GalleryRow = {
  id: string;
  mediaId: string;
  caption: string | null;
  media: PickedMedia | null;
};

export async function institutionGallery(institutionId: string): Promise<GalleryRow[]> {
  const rows = await db
    .select({
      id: institutionImages.id,
      mediaId: institutionImages.mediaId,
      caption: institutionImages.caption,
      media: {
        id: mediaAssets.id,
        kind: mediaAssets.kind,
        staticPath: mediaAssets.staticPath,
        cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        filename: mediaAssets.filename,
        altText: mediaAssets.altText,
      },
    })
    .from(institutionImages)
    .leftJoin(mediaAssets, eq(mediaAssets.id, institutionImages.mediaId))
    .where(eq(institutionImages.institutionId, institutionId))
    .orderBy(asc(institutionImages.sortOrder));
  return rows;
}

export async function partnersAndInstitutionNames() {
  const [partnerRows, institutionRows] = await Promise.all([
    db.select({ id: partners.id, name: partners.name, institutionId: partners.institutionId }).from(partners),
    db.select({ id: institutions.id, name: institutions.name }).from(institutions),
  ]);
  return { partners: partnerRows, institutions: institutionRows };
}
