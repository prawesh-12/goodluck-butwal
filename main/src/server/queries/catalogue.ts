import { cache } from "react";
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import {
  courseCategories,
  courses,
  destinations,
  institutionImages,
  institutions,
  mediaAssets,
} from "@db/schema";
import { offsetOf, PER_PAGE, type CourseQuery } from "@/components/catalogue/filters";

type MediaRow = {
  kind: "static" | "cloudinary" | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
};

// Same rule as the admin picker, kept here so a public page never imports an admin module.
export function mediaUrl(row: MediaRow, width = 640) {
  if (row.kind !== "cloudinary") return row.staticPath ?? "";
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${row.cloudinaryPublicId}`;
}

export type PublicInstitution = {
  slug: string;
  name: string;
  logo: string;
  city: string;
  country: string;
  destination: string;
  destinationSlug: string;
  website: string;
  isPartner: boolean;
  descriptionHtml: string;
};

export const listInstitutions = cache(async (): Promise<PublicInstitution[]> => {
  const rows = await db
    .select({
      slug: institutions.slug,
      name: institutions.name,
      city: institutions.city,
      country: institutions.country,
      website: institutions.websiteUrl,
      isPartner: institutions.isPartner,
      descriptionHtml: institutions.descriptionHtml,
      destination: destinations.name,
      destinationSlug: destinations.slug,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(institutions)
    .leftJoin(destinations, eq(institutions.destinationId, destinations.id))
    .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
    .where(eq(institutions.status, "published"))
    .orderBy(desc(institutions.isFeatured), asc(institutions.name));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    logo: mediaUrl(row, 640),
    city: row.city ?? "",
    country: row.country ?? "",
    destination: row.destination ?? "",
    destinationSlug: row.destinationSlug ?? "",
    website: row.website ?? "",
    isPartner: row.isPartner,
    descriptionHtml: row.descriptionHtml ?? "",
  }));
});

export const getInstitution = cache(async (slug: string) =>
  (await listInstitutions()).find((i) => i.slug === slug),
);

export type GalleryImage = { src: string; caption: string };

export const listInstitutionImages = cache(async (slug: string): Promise<GalleryImage[]> => {
  const rows = await db
    .select({
      caption: institutionImages.caption,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(institutionImages)
    .innerJoin(institutions, eq(institutionImages.institutionId, institutions.id))
    .innerJoin(mediaAssets, eq(institutionImages.mediaId, mediaAssets.id))
    .where(and(eq(institutions.slug, slug), eq(institutions.status, "published")))
    .orderBy(asc(institutionImages.sortOrder));

  return rows.map((row) => ({ src: mediaUrl(row, 640), caption: row.caption ?? "" }));
});

export type PublicCourse = {
  slug: string;
  name: string;
  level: string;
  duration: string;
  intakes: string[];
  fee: string;
  category: string;
  destination: string;
  destinationSlug: string;
  institution: string;
  institutionSlug: string;
  institutionLogo: string;
  city: string;
  country: string;
  descriptionHtml: string;
  entryRequirementsHtml: string;
};

const courseColumns = {
  slug: courses.slug,
  name: courses.name,
  level: courses.qualificationLevel,
  durationMonths: courses.durationMonths,
  durationLabel: courses.durationLabel,
  intakes: courses.intakes,
  feeMin: courses.tuitionFeeMin,
  feeMax: courses.tuitionFeeMax,
  currency: courses.tuitionCurrency,
  descriptionHtml: courses.descriptionHtml,
  entryRequirementsHtml: courses.entryRequirementsHtml,
  category: courseCategories.name,
  destination: destinations.name,
  destinationSlug: destinations.slug,
  institution: institutions.name,
  institutionSlug: institutions.slug,
  city: institutions.city,
  country: courses.country,
  kind: mediaAssets.kind,
  staticPath: mediaAssets.staticPath,
  cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
};

type CourseRow = {
  slug: string;
  name: string;
  level: string | null;
  durationMonths: number | null;
  durationLabel: string | null;
  intakes: string[] | null;
  feeMin: string | null;
  feeMax: string | null;
  currency: string | null;
  descriptionHtml: string | null;
  entryRequirementsHtml: string | null;
  category: string | null;
  destination: string | null;
  destinationSlug: string | null;
  institution: string;
  institutionSlug: string;
  city: string | null;
  country: string | null;
  kind: "static" | "cloudinary" | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
};

const money = (value: string) => Number(value).toLocaleString("en-AU", { maximumFractionDigits: 0 });

function feeRange(min: string | null, max: string | null, currency: string | null) {
  if (!min && !max) return "";
  const range = min && max && min !== max ? `${money(min)} – ${money(max)}` : money((min ?? max)!);
  return `${currency ?? ""} ${range}`.trim();
}

const levelLabel = (level: string | null) =>
  level ? level.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "";

function toCourse(row: CourseRow): PublicCourse {
  return {
    slug: row.slug,
    name: row.name,
    level: levelLabel(row.level),
    duration: row.durationLabel ?? (row.durationMonths ? `${row.durationMonths} months` : ""),
    intakes: row.intakes ?? [],
    fee: feeRange(row.feeMin, row.feeMax, row.currency),
    category: row.category ?? "",
    destination: row.destination ?? "",
    destinationSlug: row.destinationSlug ?? "",
    institution: row.institution,
    institutionSlug: row.institutionSlug,
    institutionLogo: mediaUrl(row, 320),
    city: row.city ?? "",
    country: row.country ?? "",
    descriptionHtml: row.descriptionHtml ?? "",
    entryRequirementsHtml: row.entryRequirementsHtml ?? "",
  };
}

function courseWhere(query: CourseQuery) {
  const parts: (SQL | undefined)[] = [
    eq(courses.status, "published"),
    eq(institutions.status, "published"),
  ];
  if (query.destination) parts.push(eq(destinations.slug, query.destination));
  if (query.level) parts.push(eq(courses.qualificationLevel, query.level));
  if (query.category) parts.push(eq(courseCategories.slug, query.category));
  if (query.institution) parts.push(eq(institutions.slug, query.institution));
  // Intakes are a text array, matched case-insensitively so "March" and "march" both count.
  if (query.intake)
    parts.push(
      sql`exists (select 1 from unnest(${courses.intakes}) as i where lower(i) = lower(${query.intake}))`,
    );
  if (query.q) {
    const like = `%${query.q}%`;
    parts.push(
      or(ilike(courses.name, like), ilike(institutions.name, like), ilike(courses.country, like)),
    );
  }
  return and(...parts);
}

export async function listCourses(query: CourseQuery) {
  const where = courseWhere(query);

  const [rows, totals] = await Promise.all([
    db
      .select(courseColumns)
      .from(courses)
      .innerJoin(institutions, eq(courses.institutionId, institutions.id))
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .leftJoin(destinations, eq(courses.destinationId, destinations.id))
      .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
      .where(where)
      .orderBy(asc(courses.name))
      .limit(PER_PAGE)
      .offset(offsetOf(query.page)),
    db
      .select({ value: count() })
      .from(courses)
      .innerJoin(institutions, eq(courses.institutionId, institutions.id))
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .leftJoin(destinations, eq(courses.destinationId, destinations.id))
      .where(where),
  ]);

  return { rows: rows.map(toCourse), total: totals[0]?.value ?? 0 };
}

export const getCourse = cache(async (slug: string): Promise<PublicCourse | undefined> => {
  const rows = await db
    .select(courseColumns)
    .from(courses)
    .innerJoin(institutions, eq(courses.institutionId, institutions.id))
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .leftJoin(destinations, eq(courses.destinationId, destinations.id))
    .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
    .where(
      and(
        eq(courses.slug, slug),
        eq(courses.status, "published"),
        eq(institutions.status, "published"),
      ),
    )
    .limit(1);

  return rows[0] ? toCourse(rows[0]) : undefined;
});

export type FilterOption = { slug: string; name: string };

export const listCourseFilterOptions = cache(async () => {
  const [destinationRows, categoryRows, institutionRows] = await Promise.all([
    db
      .select({ slug: destinations.slug, name: destinations.name })
      .from(destinations)
      .where(eq(destinations.status, "published"))
      .orderBy(asc(destinations.sortOrder)),
    db
      .select({ slug: courseCategories.slug, name: courseCategories.name })
      .from(courseCategories)
      .orderBy(asc(courseCategories.sortOrder)),
    db
      .select({ slug: institutions.slug, name: institutions.name })
      .from(institutions)
      .where(eq(institutions.status, "published"))
      .orderBy(asc(institutions.name)),
  ]);

  return {
    destinations: destinationRows as FilterOption[],
    categories: categoryRows as FilterOption[],
    institutions: institutionRows as FilterOption[],
  };
});
