import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@goodluck/db";
import { courseCategories, courses, destinations, institutions } from "@goodluck/db/schema";
import { combine, pageOf, PAGE_SIZE, type CatalogueFilters } from "@/lib/utils/admin-query";

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
