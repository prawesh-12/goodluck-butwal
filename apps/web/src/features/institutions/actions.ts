"use server";

import { revalidatePath } from "next/cache";
import { TAGS, invalidate, revalidateSitemap } from "@/lib/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@goodluck/db";
import { institutionImages, institutions, partners, redirects } from "@goodluck/db/schema";
import { requireActor } from "@/lib/auth/session";
import { can, requirePermission } from "@/lib/auth/rbac";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import { mediaAlt } from "@/features/media/admin-queries";
import { courseCountFor, institutionGallery, institutionSlugs, partnersAndInstitutionNames } from "@/features/institutions/admin-queries";
import {
  createInstitutionSchema,
  institutionGallerySchema,
  institutionPath,
  institutionPublishProblems,
  matchPartnersToInstitutions,
  updateInstitutionSchema,
  type InstitutionInput,
} from "@/features/institutions/validators";
import { publishRefusal, slugRedirect, type AttachedImage } from "@/lib/validators/content-fields";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

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
  };
}

async function publishProblems(data: InstitutionInput, id?: string) {
  const gallery = id ? await institutionGallery(id) : [];
  const images = [
    { label: "The logo", id: data.logoId },
    ...gallery.map((row, i) => ({ label: `Gallery picture ${i + 1}`, id: row.mediaId })),
  ].filter((image) => image.id) as { label: string; id: string }[];

  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));

  return institutionPublishProblems(data, described);
}

function publishedDate(data: { status: string }, existing: Date | null) {
  return data.status === "published" ? (existing ?? new Date()) : existing;
}

function refresh(paths: string[]) {
  invalidate(TAGS.institutions, TAGS.courses);
  revalidateSitemap();
  revalidatePath("/admin/institutions");
  revalidatePath("/institutions");
  revalidatePath("/courses");
  for (const path of paths) revalidatePath(path);
  // Course pages carry the institution's name and logo and are gated on it staying published.
  revalidatePath("/destinations/[destination]", "page");
  revalidatePath("/courses/[slug]", "page");
}

export async function createInstitution(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "institutions", "create");

  const parsed = createInstitutionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (data.status === "published" && !can(actor, "institutions", "publish")) {
    return { ok: false, error: "You cannot publish. Save it as a draft and ask an admin." };
  }

  if (data.status === "published") {
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const slug = uniqueSlug(data.slug, await institutionSlugs());
  const [row] = await db
    .insert(institutions)
    .values({
      ...columns(data),
      slug,
      publishedAt: publishedDate(data, null),
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: institutions.id });

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

  if (data.status !== existing.status && !can(actor, "institutions", "publish")) {
    return { ok: false, error: `You cannot change whether a institution is live. Ask an admin.` };
  }

  if (data.status === "published") {
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
      publishedAt: publishedDate(data, existing.publishedAt),
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, data.id));

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

  refresh([institutionPath(owner.slug)]);
  return { ok: true, data: { id: owner.id } };
}

// A partner is only linked when its name already matches an institution exactly.
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

  invalidate(TAGS.partners);
  revalidatePath("/admin/partners");
  revalidatePath("/admin/institutions");
  revalidatePath("/");
  return { ok: true, data: { linked: pairs.length } };
}
