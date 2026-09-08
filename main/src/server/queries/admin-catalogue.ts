import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import {
  courseCategories,
  courses,
  destinations,
  institutionImages,
  institutions,
  mediaAssets,
  partners,
} from "@db/schema";
import type { PickedMedia } from "@/components/admin/media-picker";

export const PAGE_SIZE = 25;

export type CatalogueFilters = {
  q?: string;
  status?: string;
  destination?: string;
  institution?: string;
  category?: string;
  level?: string;
  page?: number;
};

function combine(parts: (SQL | undefined)[]) {
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

const pageOf = (f: CatalogueFilters) => Math.max(1, f.page ?? 1);

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

export async function listAdminCourses(f: CatalogueFilters) {
  const where = combine([
    f.q ? or(ilike(courses.name, `%${f.q}%`), ilike(courses.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(courses.status, f.status as "draft") : undefined,
    f.institution ? eq(courses.institutionId, f.institution) : undefined,
    f.category ? eq(courses.categoryId, f.category) : undefined,
    f.level ? eq(courses.qualificationLevel, f.level as "bachelor") : undefined,
    f.destination ? eq(courses.destinationId, f.destination) : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: courses.id,
        slug: courses.slug,
        name: courses.name,
        institution: institutions.name,
        category: courseCategories.name,
        qualificationLevel: courses.qualificationLevel,
        durationLabel: courses.durationLabel,
        status: courses.status,
      })
      .from(courses)
      .leftJoin(institutions, eq(institutions.id, courses.institutionId))
      .leftJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
      .where(where)
      .orderBy(asc(courses.sortOrder), asc(courses.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(courses).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminCourse(id: string) {
  const [row] = await db.select().from(courses).where(eq(courses.id, id));
  return row;
}

export async function courseSlugs(exceptId?: string) {
  const rows = await db.select({ id: courses.id, slug: courses.slug }).from(courses);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}

export async function listCourseCategories() {
  return db
    .select({
      id: courseCategories.id,
      slug: courseCategories.slug,
      name: courseCategories.name,
      sortOrder: courseCategories.sortOrder,
    })
    .from(courseCategories)
    .orderBy(asc(courseCategories.sortOrder), asc(courseCategories.name));
}

export async function courseCategorySlugs(exceptId?: string) {
  const rows = await db.select({ id: courseCategories.id, slug: courseCategories.slug }).from(courseCategories);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}

export async function coursesPerCategory() {
  const rows = await db
    .select({ categoryId: courses.categoryId, n: count() })
    .from(courses)
    .groupBy(courses.categoryId);
  return new Map(rows.map((row) => [row.categoryId, row.n]));
}

export async function destinationOptions() {
  return db
    .select({ id: destinations.id, name: destinations.name })
    .from(destinations)
    .orderBy(asc(destinations.name));
}

// The CSV names an institution and a subject area by web address, so both are looked up once.
export async function idsBySlug() {
  const [institutionRows, categoryRows] = await Promise.all([
    db
      .select({
        id: institutions.id,
        slug: institutions.slug,
        name: institutions.name,
        destinationId: institutions.destinationId,
        country: institutions.country,
      })
      .from(institutions),
    db.select({ id: courseCategories.id, slug: courseCategories.slug }).from(courseCategories),
  ]);
  return {
    institutions: new Map(institutionRows.map((row) => [row.slug, row])),
    categories: new Map(categoryRows.map((row) => [row.slug, row.id])),
  };
}

export async function partnersAndInstitutionNames() {
  const [partnerRows, institutionRows] = await Promise.all([
    db.select({ id: partners.id, name: partners.name, institutionId: partners.institutionId }).from(partners),
    db.select({ id: institutions.id, name: institutions.name }).from(institutions),
  ]);
  return { partners: partnerRows, institutions: institutionRows };
}
