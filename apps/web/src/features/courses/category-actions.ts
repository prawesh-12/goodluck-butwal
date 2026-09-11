"use server";

import { revalidatePath } from "next/cache";
import { TAGS, invalidate } from "@/lib/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@goodluck/db";
import { courseCategories, courses } from "@goodluck/db/schema";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import { uniqueSlug } from "@/lib/utils/slug";
import {
  createCourseCategorySchema,
  updateCourseCategorySchema,
} from "@/features/courses/validators";
import { courseCategorySlugs } from "@/features/courses/admin-queries";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function refresh() {
  invalidate(TAGS.courses);
  revalidatePath("/admin/courses");
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

  refresh();
  return { ok: true, data: { id: parsed.data.id } };
}
