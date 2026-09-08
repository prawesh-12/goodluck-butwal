"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { courseCategories, courses } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { uniqueSlug } from "@/lib/slug";
import {
  createCourseCategorySchema,
  reorderSchema,
  updateCourseCategorySchema,
} from "@/lib/validators/course";
import { courseCategorySlugs } from "@/server/queries/admin-catalogue";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function refresh() {
  revalidatePath("/admin/course-categories");
  revalidatePath("/courses");
}

export async function createCourseCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courseCategories", "create");

  const parsed = createCourseCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const slug = uniqueSlug(data.slug || data.name, await courseCategorySlugs());

  const [created] = await db
    .insert(courseCategories)
    .values({ slug, name: data.name, sortOrder: data.sortOrder, createdBy: actor.id, updatedBy: actor.id })
    .returning({ id: courseCategories.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "course_categories",
    entityId: created.id,
    summary: `added the ${data.name} subject area`,
  });

  refresh();
  return { ok: true, data: created };
}

export async function updateCourseCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courseCategories", "update");

  const parsed = updateCourseCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ slug: courseCategories.slug })
    .from(courseCategories)
    .where(eq(courseCategories.id, data.id));
  if (!existing) return { ok: false, error: "That subject area no longer exists." };

  const slug = data.slug
    ? uniqueSlug(data.slug, await courseCategorySlugs(data.id))
    : existing.slug;

  await db
    .update(courseCategories)
    .set({ slug, name: data.name, sortOrder: data.sortOrder, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(courseCategories.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "course_categories",
    entityId: data.id,
    summary: `renamed a subject area to ${data.name}`,
  });

  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function deleteCourseCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "courseCategories", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That subject area could not be found." };

  const [existing] = await db
    .select({ name: courseCategories.name })
    .from(courseCategories)
    .where(eq(courseCategories.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That subject area no longer exists." };

  const [used] = await db
    .select({ n: count() })
    .from(courses)
    .where(eq(courses.categoryId, parsed.data.id));
  if (used.n > 0) {
    return {
      ok: false,
      error: `${used.n} ${used.n === 1 ? "course is" : "courses are"} filed under ${existing.name}. Move them first.`,
    };
  }

  await db.delete(courseCategories).where(eq(courseCategories.id, parsed.data.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "course_categories",
    entityId: parsed.data.id,
    summary: `deleted the ${existing.name} subject area`,
  });

  refresh();
  return { ok: true, data: { id: parsed.data.id } };
}

export async function reorderCourseCategories(input: unknown): Promise<Result<{ moved: number }>> {
  const actor = await requireActor();
  requirePermission(actor, "courseCategories", "update");

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That order could not be read." };
  const { ids } = parsed.data;

  const known = await courseCategorySlugs();
  if (ids.length !== known.length) return { ok: false, error: "The list changed. Reload and try again." };

  for (const [index, id] of ids.entries()) {
    await db
      .update(courseCategories)
      .set({ sortOrder: index, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(courseCategories.id, id));
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "course_categories",
    summary: `reordered ${ids.length} subject areas`,
  });

  refresh();
  return { ok: true, data: { moved: ids.length } };
}
