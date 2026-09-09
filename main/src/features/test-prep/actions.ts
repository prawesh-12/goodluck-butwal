"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { offices, redirects, testPrepBatches, testPrepCourses, testPrepRegistrations } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/security/audit";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import { mediaAlt } from "@/features/media/admin-queries";
import { batchSeats, courseOwner, courseSlugsInUse, registrationOwner } from "@/features/test-prep/admin-queries";
import {
  createBatchSchema,
  createTestPrepCourseSchema,
  testPrepPath,
  testPrepPublishProblems,
  updateBatchSchema,
  updateRegistrationSchema,
  updateTestPrepCourseSchema,
  type BatchInput,
  type TestPrepCourseInput,
} from "@/features/test-prep/validators";
import { missingAltProblems } from "@/lib/validators/content-fields";
import { publishRefusal, seoValues, slugRedirect } from "@/features/pages/validators";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);
const blank = (value: string) => (value === "" ? null : value);

// Test prep is Nepal's, matrix section 7. Every course is filed to the Nepal office so the
// ownership check has something to compare against.
async function nepalOfficeId() {
  const [row] = await db.select({ id: offices.id }).from(offices).where(eq(offices.code, "np"));
  return row?.id ?? null;
}

async function courseProblems(data: TestPrepCourseInput) {
  const alt = await mediaAlt([data.heroImageId, data.seoOgImageId]);
  return [
    ...testPrepPublishProblems(data),
    ...missingAltProblems([
      { label: "The course picture", id: data.heroImageId, altText: alt.get(data.heroImageId ?? "") ?? null },
      { label: "The share image", id: data.seoOgImageId, altText: alt.get(data.seoOgImageId ?? "") ?? null },
    ]),
  ];
}

function courseValues(data: TestPrepCourseInput, slug: string, descriptionHtml: string) {
  return {
    slug,
    testType: data.testType,
    name: data.name,
    summary: blank(data.summary),
    descriptionHtml: blank(descriptionHtml),
    syllabus: data.syllabus,
    heroImageId: data.heroImageId,
    defaultFee: blank(data.defaultFee),
    feeCurrency: data.feeCurrency.toUpperCase(),
    status: data.status,
    publishedAt: data.status === "published" ? new Date() : null,
    sortOrder: data.sortOrder,
    ...seoValues(data),
  };
}

function refreshCourse(slugs: string[]) {
  revalidatePath("/admin/test-prep");
  revalidatePath("/test-preparation");
  revalidatePath("/test-preparation/batches");
  for (const slug of slugs) revalidatePath(testPrepPath(slug));
}

export async function createTestPrepCourse(input: unknown): Promise<Result<{ id: string; slug: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "testPrep", "create");

  const parsed = createTestPrepCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const officeId = await nepalOfficeId();
  requireOwnership(actor, { officeId });

  if (GOING_LIVE.has(data.status)) {
    const problems = await courseProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const slug = uniqueSlug(data.slug || data.name, await courseSlugsInUse());
  const [created] = await db
    .insert(testPrepCourses)
    .values({
      ...courseValues(data, slug, sanitize(data.descriptionHtml)),
      officeId,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: testPrepCourses.id, slug: testPrepCourses.slug });

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" ? "publish" : "create",
    entityType: "test_prep_courses",
    entityId: created.id,
    summary: `created the course ${created.slug}`,
  });

  refreshCourse([created.slug]);
  return { ok: true, data: created };
}

export async function updateTestPrepCourse(input: unknown): Promise<Result<{ id: string; slug: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "testPrep", "update");

  const parsed = updateTestPrepCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: testPrepCourses.id,
      slug: testPrepCourses.slug,
      status: testPrepCourses.status,
      officeId: testPrepCourses.officeId,
      publishedAt: testPrepCourses.publishedAt,
    })
    .from(testPrepCourses)
    .where(eq(testPrepCourses.id, data.id));
  if (!existing) return { ok: false, error: "That course no longer exists." };

  // Checked on the loaded row, never on the id that came from the form.
  requireOwnership(actor, existing);

  if (GOING_LIVE.has(data.status)) {
    const problems = await courseProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const slug = data.slug
    ? uniqueSlug(data.slug, await courseSlugsInUse(existing.id))
    : existing.slug;

  await db
    .update(testPrepCourses)
    .set({
      ...courseValues(data, slug, sanitize(data.descriptionHtml)),
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(testPrepCourses.id, data.id));

  const moved = slugRedirect(testPrepPath(existing.slug), testPrepPath(slug), existing.status === "published");
  if (moved) {
    await db
      .insert(redirects)
      .values({ ...moved, createdBy: actor.id, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: moved.toPath, isActive: true, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "test_prep_courses",
    entityId: data.id,
    summary: moved ? `${existing.slug} is now ${slug}, 301 written` : `updated the course ${slug}`,
  });

  refreshCourse([slug, existing.slug]);
  return { ok: true, data: { id: data.id, slug } };
}

export async function deleteTestPrepCourse(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "testPrep", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That course could not be found." };

  const existing = await courseOwner(parsed.data.id);
  if (!existing) return { ok: false, error: "That course no longer exists." };
  requireOwnership(actor, existing);

  // Deleting a course cascades to its batches and every registration on them.
  const [{ n }] = await db
    .select({ n: count() })
    .from(testPrepBatches)
    .where(eq(testPrepBatches.courseId, existing.id));
  if (n > 0) {
    return { ok: false, error: `${existing.name} still has ${n} batch${n === 1 ? "" : "es"}. Delete those first.` };
  }

  await db.delete(testPrepCourses).where(eq(testPrepCourses.id, existing.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "test_prep_courses",
    entityId: existing.id,
    summary: `deleted the course ${existing.name}`,
  });

  refreshCourse([existing.slug]);
  return { ok: true, data: { id: existing.id } };
}

function batchValues(data: BatchInput) {
  return {
    courseId: data.courseId,
    batchName: data.batchName,
    startDate: data.startDate,
    endDate: data.endDate,
    scheduleDays: data.scheduleDays,
    startTime: data.startTime,
    endTime: data.endTime,
    mode: data.mode,
    trainerId: data.trainerId,
    totalSeats: data.totalSeats,
    seatsTaken: data.seatsTaken,
    fee: blank(data.fee),
    status: data.status,
    notes: blank(data.notes),
  };
}

function refreshBatches(courseSlug?: string) {
  revalidatePath("/admin/test-prep/batches");
  revalidatePath("/test-preparation/batches");
  if (courseSlug) revalidatePath(testPrepPath(courseSlug));
}

export async function createBatch(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "batches", "create");

  const parsed = createBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // The batch has no office of its own. Its course decides who may touch it.
  const course = await courseOwner(data.courseId);
  if (!course) return { ok: false, error: "Choose a course that exists." };
  requireOwnership(actor, course);

  const [created] = await db
    .insert(testPrepBatches)
    .values({ ...batchValues(data), createdBy: actor.id, updatedBy: actor.id })
    .returning({ id: testPrepBatches.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "test_prep_batches",
    entityId: created.id,
    summary: `created the batch ${data.batchName} on ${course.name}`,
  });

  refreshBatches(course.slug);
  return { ok: true, data: created };
}

export async function updateBatch(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "batches", "update");

  const parsed = updateBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await batchSeats(data.id);
  if (!existing) return { ok: false, error: "That batch no longer exists." };
  requireOwnership(actor, existing);

  const course = await courseOwner(data.courseId);
  if (!course) return { ok: false, error: "Choose a course that exists." };
  requireOwnership(actor, course);

  await db
    .update(testPrepBatches)
    .set({ ...batchValues(data), updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(testPrepBatches.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "test_prep_batches",
    entityId: data.id,
    summary: `updated the batch ${data.batchName}`,
  });

  refreshBatches(course.slug);
  return { ok: true, data: { id: data.id } };
}

export async function deleteBatch(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "batches", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That batch could not be found." };

  const existing = await batchSeats(parsed.data.id);
  if (!existing) return { ok: false, error: "That batch no longer exists." };
  requireOwnership(actor, existing);

  // Deleting the batch takes its registrations with it.
  const [{ n }] = await db
    .select({ n: count() })
    .from(testPrepRegistrations)
    .where(eq(testPrepRegistrations.batchId, existing.id));
  if (n > 0) {
    return { ok: false, error: `That batch has ${n} registration${n === 1 ? "" : "s"}. Close it instead of deleting it.` };
  }

  await db.delete(testPrepBatches).where(eq(testPrepBatches.id, existing.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "test_prep_batches",
    entityId: existing.id,
    summary: "deleted a batch",
  });

  refreshBatches();
  return { ok: true, data: { id: existing.id } };
}

export async function updateRegistration(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "registrations", "update");

  const parsed = updateRegistrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields below." };
  const data = parsed.data;

  const existing = await registrationOwner(data.id);
  if (!existing) return { ok: false, error: "That registration no longer exists." };
  requireOwnership(actor, existing);

  // notes hold what the visitor wrote, so they are only touched when something was typed.
  await db
    .update(testPrepRegistrations)
    .set({
      status: data.status,
      ...(data.notes === undefined ? {} : { notes: data.notes || null }),
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(testPrepRegistrations.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "test_prep_registrations",
    entityId: data.id,
    summary: `${existing.fullName} is now ${data.status}`,
  });

  revalidatePath("/admin/test-prep/registrations");
  return { ok: true, data: { id: data.id } };
}
