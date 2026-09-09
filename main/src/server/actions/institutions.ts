"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { institutionImages, institutions, partners, redirects } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import { mediaAlt } from "@/server/queries/admin-content";
import {
  courseCountFor,
  institutionGallery,
  institutionSlugs,
  partnersAndInstitutionNames,
} from "@/server/queries/admin-catalogue";
import {
  createInstitutionSchema,
  institutionGallerySchema,
  institutionPath,
  institutionPublishProblems,
  matchPartnersToInstitutions,
  updateInstitutionSchema,
  type InstitutionInput,
} from "@/lib/validators/institution";
import { publishRefusal, seoValues, slugRedirect, type AttachedImage } from "@/lib/validators/page";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);

const blank = (value: string) => (value === "" ? null : value);

function columns(data: InstitutionInput) {
  return {
    name: data.name,
    logoId: data.logoId,
    destinationId: data.destinationId,
    country: blank(data.country),
    city: blank(data.city),
    websiteUrl: blank(data.websiteUrl),
    descriptionHtml: sanitize(data.descriptionHtml) || null,
    isPartner: data.isPartner,
    isFeatured: data.isFeatured,
    status: data.status,
    sortOrder: data.sortOrder,
    ...seoValues(data),
  };
}

async function publishProblems(data: InstitutionInput, id?: string) {
  const gallery = id ? await institutionGallery(id) : [];
  const images = [
    { label: "The logo", id: data.logoId },
    { label: "The share image", id: data.seoOgImageId },
    ...gallery.map((row, i) => ({ label: `Gallery picture ${i + 1}`, id: row.mediaId })),
  ].filter((image) => image.id) as { label: string; id: string }[];

  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));

  return institutionPublishProblems(data, described);
}

function refresh(paths: string[]) {
  revalidatePath("/admin/institutions");
  revalidatePath("/institutions");
  revalidatePath("/courses");
  for (const path of paths) revalidatePath(path);
}

export async function createInstitution(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "create");

  const parsed = createInstitutionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "institutions", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const slug = uniqueSlug(data.slug, await institutionSlugs());
  const [row] = await db
    .insert(institutions)
    .values({
      ...columns(data),
      slug,
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: institutions.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "institutions",
    entityId: row.id,
    summary: `added the institution ${data.name}`,
  });

  refresh([institutionPath(slug)]);
  return { ok: true, data: { id: row.id } };
}

export async function updateInstitution(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "update");

  const parsed = updateInstitutionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Loaded first, so the check is on the row as it is stored, not on the form that arrived.
  const [existing] = await db.select().from(institutions).where(eq(institutions.id, data.id));
  if (!existing) return { ok: false, error: "That institution no longer exists." };

  const taken = await institutionSlugs(existing.id);
  if (taken.includes(data.slug)) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { slug: ["Another institution already uses that address."] },
    };
  }

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "institutions", "publish");
    const problems = await publishProblems(data, existing.id);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const before = institutionPath(existing.slug);
  const after = institutionPath(data.slug);
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
    .update(institutions)
    .set({
      ...columns(data),
      slug: data.slug,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "institutions",
    entityId: data.id,
    summary: redirect ? `${existing.slug} is now ${data.slug}, 301 written` : `saved the institution ${data.name}`,
  });

  refresh([before, after]);
  return { ok: true, data: { id: data.id } };
}

export async function deleteInstitution(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That institution could not be found." };

  const [existing] = await db
    .select({ id: institutions.id, slug: institutions.slug, name: institutions.name })
    .from(institutions)
    .where(eq(institutions.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That institution no longer exists." };

  // courses cascade on delete, so the courses have to be moved by hand first.
  const used = await courseCountFor(existing.id);
  if (used > 0) {
    return {
      ok: false,
      error: `${existing.name} has ${used} ${used === 1 ? "course" : "courses"}. Move or delete ${used === 1 ? "it" : "them"} first.`,
    };
  }

  await db.delete(institutions).where(eq(institutions.id, existing.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "institutions",
    entityId: existing.id,
    summary: `deleted the institution ${existing.name}`,
  });

  refresh([institutionPath(existing.slug)]);
  return { ok: true, data: { id: existing.id } };
}

export async function saveInstitutionGallery(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "update");

  const parsed = institutionGallerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the pictures below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { institutionId, items } = parsed.data;

  const [owner] = await db
    .select({ id: institutions.id, slug: institutions.slug, name: institutions.name, status: institutions.status })
    .from(institutions)
    .where(eq(institutions.id, institutionId));
  if (!owner) return { ok: false, error: "That institution no longer exists." };

  if (owner.status === "published" && items.length > 0) {
    const alt = await mediaAlt(items.map((item) => item.mediaId));
    const undescribed = items
      .map((item, i) => ({ i, altText: alt.get(item.mediaId) ?? null }))
      .filter((item) => item.altText === null);
    if (undescribed.length > 0) {
      return publishRefusal(
        undescribed.map((item) => `Gallery picture ${item.i + 1} has no alt text. Describe it in Media first.`),
      );
    }
  }

  const kept = items.map((item) => item.id).filter(Boolean) as string[];
  const existing = await db
    .select({ id: institutionImages.id })
    .from(institutionImages)
    .where(eq(institutionImages.institutionId, owner.id));

  const removed = existing.filter((row) => !kept.includes(row.id)).map((row) => row.id);
  if (removed.length > 0) await db.delete(institutionImages).where(inArray(institutionImages.id, removed));

  for (const [index, item] of items.entries()) {
    const values = {
      institutionId: owner.id,
      mediaId: item.mediaId,
      caption: item.caption || null,
      sortOrder: index,
      updatedBy: actor.id,
      updatedAt: new Date(),
    };
    if (item.id) await db.update(institutionImages).set(values).where(eq(institutionImages.id, item.id));
    else await db.insert(institutionImages).values({ ...values, createdBy: actor.id });
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "institution_images",
    entityId: owner.id,
    summary: `saved ${items.length} gallery pictures on ${owner.name}`,
  });

  refresh([institutionPath(owner.slug)]);
  return { ok: true, data: { id: owner.id } };
}

// The ticker and the institution pages should show one set of logos. Nothing is invented here:
// a partner is only linked when its name already matches an institution exactly.
export async function linkPartnersToInstitutions(): Promise<Result<{ linked: number }>> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "update");
  requirePermission(actor, "partners", "update");

  const { partners: partnerRows, institutions: institutionRows } = await partnersAndInstitutionNames();
  const pairs = matchPartnersToInstitutions(partnerRows, institutionRows);
  if (pairs.length === 0) return { ok: true, data: { linked: 0 } };

  for (const pair of pairs) {
    await db
      .update(partners)
      .set({ institutionId: pair.institutionId, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(partners.id, pair.partnerId));
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "partners",
    summary: `linked ${pairs.length} partner logos to institutions`,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/admin/institutions");
  revalidatePath("/");
  return { ok: true, data: { linked: pairs.length } };
}
