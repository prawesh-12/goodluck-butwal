"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { pages, redirects } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { requirePermission, type Actor } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/security/audit";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import { mediaAlt } from "@/features/media/admin-queries";
import { slugsInUse } from "@/features/pages/admin-queries";
import { missingAltProblems, type AttachedImage } from "@/lib/validators/content-fields";
import { blocksSchemaFor, createPageSchema, pagePath, pagePublishProblems, publishRefusal, seoValues, slugRedirect, updatePageSchema } from "@/features/pages/validators";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);

// Any key ending in _id inside blocks points at a media row, whatever the slug's shape is.
function imagesIn(value: unknown, trail: string[] = []): { label: string; id: string }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => imagesIn(item, [...trail, `item ${index + 1}`]));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      if (key.endsWith("_id")) {
        return typeof child === "string" ? [{ label: describe([...trail, key.slice(0, -3)]), id: child }] : [];
      }
      return imagesIn(child, [...trail, key]);
    });
  }
  return [];
}

function describe(trail: string[]) {
  const words = trail.join(" ").replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

async function publishProblems(
  data: { slug: string; title: string; bodyHtml: string; heroImageId: string | null; seoOgImageId: string | null },
  blocks: unknown,
) {
  const images = [
    { label: "The hero image", id: data.heroImageId },
    { label: "The share image", id: data.seoOgImageId },
    ...imagesIn(blocks),
  ].filter((image) => image.id) as { label: string; id: string }[];

  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));

  return [...pagePublishProblems({ ...data, blocks }), ...missingAltProblems(described)];
}

function cleanBlocks(slug: string, blocks: Record<string, unknown>) {
  if (slug !== "message-from-co-founders") return blocks;
  return { ...blocks, message_html: sanitize(String(blocks.message_html ?? "")) };
}

export async function createPage(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "pages", "create");

  const parsed = createPageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const slug = uniqueSlug(data.slug, await slugsInUse("pages"));
  const blocks = cleanBlocks(slug, blocksSchemaFor(slug).parse(data.blocks ?? {}) as Record<string, unknown>);
  const bodyHtml = sanitize(data.bodyHtml);

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "pages", "publish");
    const problems = await publishProblems({ ...data, slug, bodyHtml }, blocks);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const [row] = await db
    .insert(pages)
    .values({
      slug,
      parent: data.parent,
      title: data.title,
      intro: data.intro || null,
      bodyHtml: bodyHtml || null,
      heroImageId: data.heroImageId,
      blocks,
      showInNav: data.showInNav,
      status: data.status,
      publishedAt: data.status === "published" ? new Date() : null,
      sortOrder: data.sortOrder,
      ...seoValues(data),
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: pages.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "pages",
    entityId: row.id,
    summary: `created the page ${data.title}`,
  });

  revalidatePath("/admin/pages");
  revalidatePath(pagePath(data.parent, slug));
  return { ok: true, data: { id: row.id } };
}

export async function updatePage(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "pages", "update");

  const parsed = updatePageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db.select().from(pages).where(eq(pages.id, data.id));
  if (!existing) return { ok: false, error: "That page no longer exists." };

  const taken = await slugsInUse("pages", existing.id);
  if (taken.includes(data.slug)) {
    return { ok: false, error: "Check the fields below.", fieldErrors: { slug: ["Another page already uses that address."] } };
  }

  const blocks = cleanBlocks(data.slug, blocksSchemaFor(data.slug).parse(data.blocks ?? {}) as Record<string, unknown>);
  const bodyHtml = sanitize(data.bodyHtml);

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "pages", "publish");
    const problems = await publishProblems({ ...data, bodyHtml }, blocks);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const before = pagePath(existing.parent, existing.slug);
  const after = pagePath(data.parent, data.slug);
  const redirect = slugRedirect(before, after, existing.status === "published");
  if (redirect) await keepOldAddress(actor, redirect);

  await db
    .update(pages)
    .set({
      slug: data.slug,
      parent: data.parent,
      title: data.title,
      intro: data.intro || null,
      bodyHtml: bodyHtml || null,
      heroImageId: data.heroImageId,
      blocks,
      showInNav: data.showInNav,
      status: data.status,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      sortOrder: data.sortOrder,
      ...seoValues(data),
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "pages",
    entityId: data.id,
    summary: `saved the page ${data.title}`,
  });

  revalidatePath("/admin/pages");
  revalidatePath(before);
  if (after !== before) revalidatePath(after);
  return { ok: true, data: { id: data.id } };
}

export async function deletePage(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "pages", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That page could not be found." };

  const [existing] = await db
    .select({ id: pages.id, slug: pages.slug, parent: pages.parent, title: pages.title })
    .from(pages)
    .where(eq(pages.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That page no longer exists." };

  await db.delete(pages).where(eq(pages.id, existing.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "pages",
    entityId: existing.id,
    summary: `deleted the page ${existing.title}`,
  });

  revalidatePath("/admin/pages");
  revalidatePath(pagePath(existing.parent, existing.slug));
  return { ok: true, data: { id: existing.id } };
}

async function keepOldAddress(actor: Actor, redirect: ReturnType<typeof slugRedirect>) {
  if (!redirect) return;
  await db
    .insert(redirects)
    .values({ ...redirect, createdBy: actor.id, updatedBy: actor.id })
    .onConflictDoUpdate({
      target: redirects.fromPath,
      set: { toPath: redirect.toPath, isActive: true, note: redirect.note, updatedBy: actor.id, updatedAt: new Date() },
    });
}
