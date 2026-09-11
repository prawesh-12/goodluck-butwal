"use server";

import { revalidatePath } from "next/cache";
import { TAGS, invalidate, revalidateSitemap } from "@/lib/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { postTags, posts, redirects } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { can, requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import {
  createPostSchema,
  postPublishProblems,
  readingMinutes,
  updatePostSchema,
  type PostInput,
} from "@/features/posts/validators";
import { mediaAlt, pickedMedia } from "@/features/media/admin-queries";
import { slugRedirect } from "@/lib/validators/content-fields";
import { postSlugs } from "@/features/posts/admin-queries";

type Result =
  | { ok: true; data: { id: string; slug: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

const goesLive = (status: string) => status === "published";

async function publishProblems(data: PostInput) {
  const alt = await mediaAlt([data.bannerImageId]);
  return postPublishProblems(data, { banner: alt.get(data.bannerImageId) });
}

function publishedDate(data: PostInput, existing: Date | null) {
  return data.status === "published" ? (existing ?? new Date()) : existing;
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
    publishedAt: publishedDate(data, existingDate),
  };
}

async function setTags(postId: string, tagIds: string[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length > 0) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

function refresh(slugs: string[]) {
  invalidate(TAGS.posts);
  revalidateSitemap();
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");
  for (const slug of slugs) revalidatePath(`/news/${slug}`);
  // Retagging moves an article between these, and the row alone does not say which changed.
  revalidatePath("/news/category/[slug]", "page");
  revalidatePath("/news/tag/[slug]", "page");
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

  const moved = slugRedirect(`/news/${existing.slug}`, `/news/${slug}`, existing.status === "published");
  if (moved) {
    await db
      .insert(redirects)
      .values({ ...moved, createdBy: actor.id, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: moved.toPath, isActive: true, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

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

  const found = (await pickedMedia([parsed.data.id]))[parsed.data.id];
  if (!found) return { ok: false, error: "That image is no longer in the media library." };
  return { ok: true, data: found };
}
