"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { postTags, posts, redirects } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can, requireOwnership, requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import {
  createPostSchema,
  postPublishProblems,
  readingMinutes,
  redirectForRename,
  updatePostSchema,
  type PostInput,
} from "@/lib/validators/post";
import { altTextByIds, pickedMedia } from "@/server/queries/admin-people";
import { postSlugs } from "@/server/queries/admin-editorial";

type Result =
  | { ok: true; data: { id: string; slug: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

const goesLive = (status: string) => status === "published" || status === "scheduled";

async function publishProblems(data: PostInput) {
  const alt = await altTextByIds([data.bannerImageId, data.seoOgImageId]);
  return postPublishProblems(data, {
    banner: alt.get(data.bannerImageId),
    shareImage: alt.get(data.seoOgImageId),
  });
}

function goLiveAt(data: PostInput, existing: Date | null) {
  if (data.publishedAt) return new Date(data.publishedAt);
  if (data.status === "published") return existing ?? new Date();
  return existing;
}

function columns(data: PostInput, slug: string, bodyHtml: string, existingDate: Date | null) {
  return {
    slug,
    title: data.title,
    excerpt: blank(data.excerpt),
    bodyHtml,
    bannerImageId: blank(data.bannerImageId),
    categoryId: blank(data.categoryId),
    officeId: blank(data.officeId),
    destinationId: blank(data.destinationId),
    authorDisplayName: blank(data.authorDisplayName),
    readingMinutes: readingMinutes(bodyHtml),
    status: data.status,
    publishedAt: goLiveAt(data, existingDate),
    seoTitle: blank(data.seoTitle),
    seoDescription: blank(data.seoDescription),
    seoOgImageId: blank(data.seoOgImageId),
    seoNoindex: data.seoNoindex,
    canonicalUrl: blank(data.canonicalUrl),
  };
}

async function setTags(postId: string, tagIds: string[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length > 0) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

function refresh(slugs: string[]) {
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
  for (const slug of slugs) revalidatePath(`/news/${slug}`);
}

export async function createPost(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "posts", "create");

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (goesLive(data.status) && !can(actor, "posts", "publish")) {
    return { ok: false, error: "You cannot publish. Save it as a draft and ask an admin." };
  }
  // A post cannot be filed under an office the writer does not belong to.
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) {
      return { ok: false, error: `Not ready to publish. Add: ${problems.join(", ")}.` };
    }
  }

  const bodyHtml = sanitize(data.bodyHtml);
  const slug = uniqueSlug(data.slug || data.title, await postSlugs());

  const [created] = await db
    .insert(posts)
    .values({ ...columns(data, slug, bodyHtml, null), authorId: actor.id, createdBy: actor.id, updatedBy: actor.id })
    .returning({ id: posts.id, slug: posts.slug });

  await setTags(created.id, data.tagIds);

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" ? "publish" : "create",
    entityType: "posts",
    entityId: created.id,
    summary: `created ${created.slug}`,
  });

  refresh([created.slug]);
  return { ok: true, data: created };
}

export async function updatePost(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "posts", "update");

  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      status: posts.status,
      officeId: posts.officeId,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.id, data.id));
  if (!existing) return { ok: false, error: "That post no longer exists." };

  // Checked on the loaded row, never on the id that came from the form.
  requireOwnership(actor, existing);
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (data.status !== existing.status && !can(actor, "posts", "publish")) {
    return { ok: false, error: "You cannot change whether a post is live. Ask an admin." };
  }

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) {
      return { ok: false, error: `Not ready to publish. Add: ${problems.join(", ")}.` };
    }
  }

  const bodyHtml = sanitize(data.bodyHtml);
  const slug = data.slug
    ? uniqueSlug(data.slug, (await postSlugs()).filter((taken) => taken !== existing.slug))
    : existing.slug;

  await db
    .update(posts)
    .set({ ...columns(data, slug, bodyHtml, existing.publishedAt), updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(posts.id, data.id));

  await setTags(data.id, data.tagIds);

  const moved = redirectForRename(existing.slug, slug, existing.status === "published");
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
    entityType: "posts",
    entityId: data.id,
    summary: moved ? `${existing.slug} is now ${slug}, 301 written` : `updated ${slug}`,
  });

  refresh([slug, existing.slug]);
  return { ok: true, data: { id: data.id, slug } };
}

export async function archivePost(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "posts", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That post could not be found." };

  const [existing] = await db
    .select({ slug: posts.slug, officeId: posts.officeId })
    .from(posts)
    .where(eq(posts.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That post no longer exists." };
  requireOwnership(actor, existing);

  await db
    .update(posts)
    .set({ status: "archived", updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(posts.id, parsed.data.id));

  await writeAudit({
    userId: actor.id,
    action: "unpublish",
    entityType: "posts",
    entityId: parsed.data.id,
    summary: `archived ${existing.slug}`,
  });

  refresh([existing.slug]);
  return { ok: true, data: { id: parsed.data.id, slug: existing.slug } };
}

type ImageResult =
  | { ok: true; data: { id: string; kind: "static" | "cloudinary"; staticPath: string | null; cloudinaryPublicId: string | null; filename: string | null; altText: string | null } }
  | { ok: false; error: string };

// The body editor inserts pictures by media library id, so it needs the row behind the id.
export async function findBodyImage(input: unknown): Promise<ImageResult> {
  const actor = await requireActor();
  requirePermission(actor, "media", "read");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That image could not be found." };

  const found = (await pickedMedia([parsed.data.id])).get(parsed.data.id);
  if (!found) return { ok: false, error: "That image is no longer in the media library." };
  return { ok: true, data: found };
}
