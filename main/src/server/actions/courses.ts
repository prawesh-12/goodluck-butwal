"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { courses, institutions, redirects } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import { mediaAlt } from "@/server/queries/admin-content";
import { courseSlugs, idsBySlug } from "@/server/queries/admin-catalogue";
import { parseCourseCsv, type ImportProblem, type ParsedCourse } from "@/lib/course-import";
import {
  coursePath,
  coursePublishProblems,
  createCourseSchema,
  updateCourseSchema,
  type CourseInput,
} from "@/lib/validators/course";
import { publishRefusal, seoValues, slugRedirect, type AttachedImage } from "@/lib/validators/page";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);

const blank = (value: string) => (value === "" ? null : value);

function columns(data: CourseInput) {
  return {
    name: data.name,
    institutionId: data.institutionId,
    destinationId: data.destinationId,
    country: blank(data.country),
    qualificationLevel: data.qualificationLevel,
    categoryId: data.categoryId,
    durationMonths: data.durationMonths,
    durationLabel: blank(data.durationLabel),
    intakes: data.intakes,
    tuitionFeeMin: blank(data.tuitionFeeMin),
    tuitionFeeMax: blank(data.tuitionFeeMax),
    tuitionCurrency: blank(data.tuitionCurrency),
    descriptionHtml: sanitize(data.descriptionHtml) || null,
    entryRequirementsHtml: sanitize(data.entryRequirementsHtml) || null,
    status: data.status,
    sortOrder: data.sortOrder,
    ...seoValues(data),
  };
}

async function publishProblems(data: CourseInput) {
  const images = [{ label: "The share image", id: data.seoOgImageId }].filter(
    (image) => image.id,
  ) as { label: string; id: string }[];
  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));
  return coursePublishProblems(data, described);
}

async function institutionExists(id: string) {
  const [row] = await db.select({ id: institutions.id }).from(institutions).where(eq(institutions.id, id));
  return Boolean(row);
}

function refresh(paths: string[]) {
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  for (const path of paths) revalidatePath(path);
}

export async function createCourse(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courses", "create");

  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (!(await institutionExists(data.institutionId))) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { institutionId: ["That institution no longer exists."] },
    };
  }

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "courses", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const slug = uniqueSlug(data.slug, await courseSlugs());
  const [row] = await db
    .insert(courses)
    .values({
      ...columns(data),
      slug,
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: courses.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "courses",
    entityId: row.id,
    summary: `added the course ${data.name}`,
  });

  refresh([coursePath(slug)]);
  return { ok: true, data: { id: row.id } };
}

export async function updateCourse(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courses", "update");

  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Loaded first, so the checks below run against the stored row, not the form that arrived.
  const [existing] = await db.select().from(courses).where(eq(courses.id, data.id));
  if (!existing) return { ok: false, error: "That course no longer exists." };

  if (!(await institutionExists(data.institutionId))) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { institutionId: ["That institution no longer exists."] },
    };
  }

  const taken = await courseSlugs(existing.id);
  if (taken.includes(data.slug)) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { slug: ["Another course already uses that address."] },
    };
  }

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "courses", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const before = coursePath(existing.slug);
  const after = coursePath(data.slug);
  const redirect = slugRedirect(before, after, existing.status === "published");
  if (redirect) {
    await db
      .insert(redirects)
      .values({ ...redirect, createdBy: actor.id, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: redirect.toPath, isActive: true, note: redirect.note, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

  await db
    .update(courses)
    .set({
      ...columns(data),
      slug: data.slug,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "courses",
    entityId: data.id,
    summary: redirect ? `${existing.slug} is now ${data.slug}, 301 written` : `saved the course ${data.name}`,
  });

  refresh([before, after]);
  return { ok: true, data: { id: data.id } };
}

export async function deleteCourse(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courses", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That course could not be found." };

  const [existing] = await db
    .select({ id: courses.id, slug: courses.slug, name: courses.name })
    .from(courses)
    .where(eq(courses.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That course no longer exists." };

  await db.delete(courses).where(eq(courses.id, existing.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "courses",
    entityId: existing.id,
    summary: `deleted the course ${existing.name}`,
  });

  refresh([coursePath(existing.slug)]);
  return { ok: true, data: { id: existing.id } };
}

export type PreviewRow = ParsedCourse & { institution: string; category: string };

type PreviewResult =
  | { ok: true; data: { rows: PreviewRow[] } }
  | { ok: false; error: string; problems: ImportProblem[] };

async function readFile(csv: string) {
  const known = await idsBySlug();
  const parsed = parseCourseCsv(csv, {
    institutionSlugs: [...known.institutions.keys()],
    categorySlugs: [...known.categories.keys()],
  });
  return { known, parsed };
}

export async function previewCourseImport(input: unknown): Promise<PreviewResult> {
  const actor = await requireActor();
  requirePermission(actor, "courses", "create");

  const form = z.object({ csv: z.string() }).safeParse(input);
  if (!form.success) return { ok: false, error: "That file could not be read.", problems: [] };

  const { known, parsed } = await readFile(form.data.csv);
  if (!parsed.ok) {
    return {
      ok: false,
      error: `Nothing was imported. ${parsed.problems.length} ${parsed.problems.length === 1 ? "problem" : "problems"} to fix first.`,
      problems: parsed.problems,
    };
  }

  return {
    ok: true,
    data: {
      rows: parsed.rows.map((row) => ({
        ...row,
        institution: known.institutions.get(row.institutionSlug)?.name ?? row.institutionSlug,
        category: row.categorySlug ?? "",
      })),
    },
  };
}

type ImportResultShape =
  | { ok: true; data: { created: number } }
  | { ok: false; error: string; problems: ImportProblem[] };

export async function importCourses(input: unknown): Promise<ImportResultShape> {
  const actor = await requireActor();
  requirePermission(actor, "courses", "create");

  const form = z.object({ csv: z.string() }).safeParse(input);
  if (!form.success) return { ok: false, error: "That file could not be read.", problems: [] };

  const { known, parsed } = await readFile(form.data.csv);
  // One bad row and the whole file is refused, so a half-loaded catalogue never happens.
  if (!parsed.ok) {
    return {
      ok: false,
      error: `Nothing was imported. Fix ${parsed.problems.length} ${parsed.problems.length === 1 ? "row" : "rows"} and try again.`,
      problems: parsed.problems,
    };
  }

  const taken = new Set(await courseSlugs());
  const values = parsed.rows.map((row) => {
    const institution = known.institutions.get(row.institutionSlug)!;
    const slug = uniqueSlug(`${institution.slug}-${row.name}`, taken);
    taken.add(slug);
    return {
      slug,
      name: row.name,
      institutionId: institution.id,
      destinationId: institution.destinationId,
      country: institution.country,
      qualificationLevel: row.qualificationLevel,
      categoryId: row.categorySlug ? (known.categories.get(row.categorySlug) ?? null) : null,
      durationMonths: row.durationMonths,
      durationLabel: row.durationLabel || null,
      intakes: row.intakes,
      tuitionFeeMin: row.tuitionFeeMin || null,
      tuitionFeeMax: row.tuitionFeeMax || null,
      tuitionCurrency: row.tuitionCurrency || null,
      // Imported rows land as drafts, so nothing reaches the site before someone reads it.
      status: "draft" as const,
      createdBy: actor.id,
      updatedBy: actor.id,
    };
  });

  await db.insert(courses).values(values);

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "courses",
    summary: `imported ${values.length} courses from a spreadsheet`,
  });

  refresh([]);
  return { ok: true, data: { created: values.length } };
}
