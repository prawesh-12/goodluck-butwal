import { cache } from "react";
import { TAGS, cached } from "@/lib/cache";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@db/client";
import { courseCategories, courses, destinations, institutions, mediaAssets } from "@db/schema";
import { offsetOf, PER_PAGE, type CourseQuery } from "@/features/courses/filters";
import { mediaUrl } from "@/lib/utils/media-url";

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
  // The total rides along as a window count, so the page costs one round trip.
  const rows = await db
    .select({ ...courseColumns, total: sql<number>`count(*) over ()`.mapWith(Number) })
    .from(courses)
    .innerJoin(institutions, eq(courses.institutionId, institutions.id))
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .leftJoin(destinations, eq(courses.destinationId, destinations.id))
    .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
    .where(courseWhere(query))
    .orderBy(asc(courses.name))
    .limit(PER_PAGE)
    .offset(offsetOf(query.page));

  return { rows: rows.map(toCourse), total: rows[0]?.total ?? 0 };
}

const getCourseUncached = cached(async (slug: string): Promise<PublicCourse | undefined> => {
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
}, ["course"], [TAGS.courses]);

export const getCourse = cache(getCourseUncached);

export type FilterOption = { slug: string; name: string };

const listCourseFilterOptionsUncached = cached(async () => {
  // Three lists in one round trip. Institutions have no order column, so the name decides.
  const rows = await unionAll(
    db
      .select({
        kind: sql<string>`'destination'`.as("kind"),
        slug: destinations.slug,
        name: destinations.name,
        ord: sql<number>`${destinations.sortOrder}`.as("ord"),
      })
      .from(destinations)
      .where(eq(destinations.status, "published")),
    db
      .select({
        kind: sql<string>`'category'`.as("kind"),
        slug: courseCategories.slug,
        name: courseCategories.name,
        ord: sql<number>`${courseCategories.sortOrder}`.as("ord"),
      })
      .from(courseCategories),
    db
      .select({
        kind: sql<string>`'institution'`.as("kind"),
        slug: institutions.slug,
        name: institutions.name,
        ord: sql<number>`0`.as("ord"),
      })
      .from(institutions)
      .where(eq(institutions.status, "published")),
  ).orderBy(sql`kind`, sql`ord`, sql`name`);

  const pick = (kind: string): FilterOption[] =>
    rows.filter((row) => row.kind === kind).map((row) => ({ slug: row.slug, name: row.name }));

  return {
    destinations: pick("destination"),
    categories: pick("category"),
    institutions: pick("institution"),
  };
}, ["course-filters"], [TAGS.courses]);

export const listCourseFilterOptions = cache(listCourseFilterOptionsUncached);
