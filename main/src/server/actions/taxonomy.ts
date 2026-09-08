"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { postCategories, postTags, posts, tags } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { uniqueSlug } from "@/lib/slug";
import {
  createPostCategorySchema,
  createTagSchema,
  updatePostCategorySchema,
  updateTagSchema,
} from "@/lib/validators/post";
import { categorySlugs, tagSlugs } from "@/server/queries/admin-editorial";

type Result =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createPostCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "postCategories", "create");

  const parsed = createPostCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const slug = uniqueSlug(data.slug || data.name, await categorySlugs());

  const [created] = await db
    .insert(postCategories)
    .values({
      slug,
      name: data.name,
      description: data.description || null,
      sortOrder: data.sortOrder,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: postCategories.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "post_categories",
    entityId: created.id,
    summary: `added the ${data.name} category`,
  });

  revalidatePath("/admin/post-categories");
  return { ok: true, data: created };
}

export async function updatePostCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "postCategories", "update");

  const parsed = updatePostCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ slug: postCategories.slug })
    .from(postCategories)
    .where(eq(postCategories.id, data.id));
  if (!existing) return { ok: false, error: "That category no longer exists." };

  const slug = data.slug
    ? uniqueSlug(data.slug, (await categorySlugs()).filter((taken) => taken !== existing.slug))
    : existing.slug;

  await db
    .update(postCategories)
    .set({
      slug,
      name: data.name,
      description: data.description || null,
      sortOrder: data.sortOrder,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(postCategories.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "post_categories",
    entityId: data.id,
    summary: `renamed a category to ${data.name}`,
  });

  revalidatePath("/admin/post-categories");
  revalidatePath("/news");
  return { ok: true, data: { id: data.id } };
}

export async function deletePostCategory(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "postCategories", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That category could not be found." };

  const [existing] = await db
    .select({ name: postCategories.name })
    .from(postCategories)
    .where(eq(postCategories.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That category no longer exists." };

  const [used] = await db
    .select({ n: count() })
    .from(posts)
    .where(eq(posts.categoryId, parsed.data.id));
  if (used.n > 0) {
    return {
      ok: false,
      error: `${used.n} ${used.n === 1 ? "post is" : "posts are"} filed under ${existing.name}. Move them first.`,
    };
  }

  await db.delete(postCategories).where(eq(postCategories.id, parsed.data.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "post_categories",
    entityId: parsed.data.id,
    summary: `deleted the ${existing.name} category`,
  });

  revalidatePath("/admin/post-categories");
  return { ok: true, data: { id: parsed.data.id } };
}

export async function createTag(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "tags", "create");

  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const slug = uniqueSlug(data.slug || data.name, await tagSlugs());

  const [created] = await db
    .insert(tags)
    .values({ slug, name: data.name, createdBy: actor.id, updatedBy: actor.id })
    .returning({ id: tags.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "tags",
    entityId: created.id,
    summary: `added the ${data.name} tag`,
  });

  revalidatePath("/admin/tags");
  return { ok: true, data: created };
}

export async function updateTag(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "tags", "update");

  const parsed = updateTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db.select({ slug: tags.slug }).from(tags).where(eq(tags.id, data.id));
  if (!existing) return { ok: false, error: "That tag no longer exists." };

  const slug = data.slug
    ? uniqueSlug(data.slug, (await tagSlugs()).filter((taken) => taken !== existing.slug))
    : existing.slug;

  await db
    .update(tags)
    .set({ slug, name: data.name, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(tags.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "tags",
    entityId: data.id,
    summary: `renamed a tag to ${data.name}`,
  });

  revalidatePath("/admin/tags");
  revalidatePath("/news");
  return { ok: true, data: { id: data.id } };
}

export async function deleteTag(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "tags", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That tag could not be found." };

  const [existing] = await db.select({ name: tags.name }).from(tags).where(eq(tags.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That tag no longer exists." };

  const [used] = await db
    .select({ n: count() })
    .from(postTags)
    .where(eq(postTags.tagId, parsed.data.id));

  await db.delete(tags).where(eq(tags.id, parsed.data.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "tags",
    entityId: parsed.data.id,
    summary: `deleted the ${existing.name} tag, removed from ${used.n} ${used.n === 1 ? "post" : "posts"}`,
  });

  revalidatePath("/admin/tags");
  revalidatePath("/news");
  return { ok: true, data: { id: parsed.data.id } };
}
