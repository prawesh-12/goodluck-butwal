"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { mediaAssets, redirects, serviceFaqs, services, uiStrings } from "@db/schema";
import { requireActor } from "@/lib/session";
import { ForbiddenError, requirePermission, type Actor } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import { imageUrl } from "@/lib/cloudinary";
import { mediaAlt, slugsInUse } from "@/server/queries/admin-content";
import {
  createServiceSchema,
  faqListSchema,
  servicePath,
  servicePublishProblems,
  updateServiceSchema,
  type ServiceInput,
} from "@/lib/validators/service";
import { missingAltProblems, publishRefusal, seoValues, slugRedirect, type AttachedImage } from "@/lib/validators/page";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);

// These four are rendered but have no column, so they are kept as interface text keyed on the slug.
const STRINGS = ["label", "poster", "stepsTitle", "listTitle"] as const;
const STRING_HELP: Record<(typeof STRINGS)[number], string> = {
  label: "Badge on the homepage card, like Study or Visa.",
  poster: "Still frame shown before the reel plays.",
  stepsTitle: "Heading above the steps list.",
  listTitle: "Heading above the documents list.",
};

// A service with no office of its own is shared. One pinned to an office is that office's alone.
function requireScope(actor: Actor, scope: "both" | "au" | "np") {
  if (actor.role === "super_admin" || scope === "both") return;
  const mine = actor.role === "au_admin" ? "au" : actor.role === "np_admin" ? "np" : null;
  if (scope !== mine) throw new ForbiddenError("that service belongs to another office");
}

async function posterPath(id: string | null) {
  if (!id) return "";
  const [row] = await db
    .select({ staticPath: mediaAssets.staticPath, publicId: mediaAssets.cloudinaryPublicId })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id));
  if (!row) return "";
  return row.staticPath ?? (row.publicId ? imageUrl(row.publicId) : "");
}

function rowValues(data: ServiceInput) {
  return {
    name: data.name,
    category: data.category,
    officeScope: data.officeScope,
    summary: data.summary || null,
    introHtml: sanitize(data.introHtml) || null,
    steps: data.steps,
    facts: data.facts,
    documents: data.documents,
    artworkId: data.artworkId,
    reelId: data.reelId,
    tone: data.tone,
    isFeatured: data.isFeatured,
    status: data.status,
    sortOrder: data.sortOrder,
    ...seoValues(data),
  };
}

async function publishProblems(data: ServiceInput) {
  const images = [
    { label: "The card artwork", id: data.artworkId },
    { label: "The reel poster", id: data.posterImageId },
    { label: "The share image", id: data.seoOgImageId },
  ].filter((image) => image.id) as { label: string; id: string }[];

  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));

  return [...servicePublishProblems(data), ...missingAltProblems(described)];
}

async function saveStrings(actor: Actor, data: ServiceInput, slug: string) {
  const poster = await posterPath(data.posterImageId);
  const values: Record<(typeof STRINGS)[number], string> = {
    label: data.label,
    poster,
    stepsTitle: data.stepsTitle,
    listTitle: data.listTitle,
  };

  for (const field of STRINGS) {
    const label = `${data.name} ${field === "label" ? "card badge" : field === "poster" ? "reel poster" : field === "stepsTitle" ? "steps heading" : "documents heading"}`;
    await db
      .insert(uiStrings)
      .values({ key: `service.${slug}.${field}`, value: values[field], group: "services", label, help: STRING_HELP[field] })
      .onConflictDoUpdate({
        target: uiStrings.key,
        set: { value: values[field], label, updatedBy: actor.id, updatedAt: new Date() },
      });
  }
}

function stringKeys(slug: string) {
  return STRINGS.map((field) => `service.${slug}.${field}`);
}

export async function createService(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "services", "create");

  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  requireScope(actor, data.officeScope);
  const slug = uniqueSlug(data.slug, await slugsInUse("services"));

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "services", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const [row] = await db
    .insert(services)
    .values({
      ...rowValues(data),
      slug,
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: services.id });

  await saveStrings(actor, data, slug);
  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "services",
    entityId: row.id,
    summary: `created the service ${data.name}`,
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(servicePath(slug));
  revalidatePath("/");
  return { ok: true, data: { id: row.id } };
}

export async function updateService(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "services", "update");

  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db.select().from(services).where(eq(services.id, data.id));
  if (!existing) return { ok: false, error: "That service no longer exists." };

  // Checked on the loaded row, and again on the scope being asked for.
  requireScope(actor, existing.officeScope);
  requireScope(actor, data.officeScope);

  const taken = await slugsInUse("services", existing.id);
  if (taken.includes(data.slug)) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { slug: ["Another service already uses that address."] },
    };
  }

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "services", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const before = servicePath(existing.slug);
  const after = servicePath(data.slug);
  const redirect = slugRedirect(before, after, existing.status === "published");
  if (redirect) {
    await db
      .insert(redirects)
      .values({ ...redirect, createdBy: actor.id, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: redirect.toPath, isActive: true, note: redirect.note, updatedBy: actor.id, updatedAt: new Date() },
      });
    // The four headings are keyed on the slug, so the old keys would be orphans.
    await db.delete(uiStrings).where(inArray(uiStrings.key, stringKeys(existing.slug)));
  }

  await db
    .update(services)
    .set({
      ...rowValues(data),
      slug: data.slug,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(services.id, data.id));

  await saveStrings(actor, data, data.slug);
  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "services",
    entityId: data.id,
    summary: `saved the service ${data.name}`,
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(before);
  if (after !== before) revalidatePath(after);
  revalidatePath("/");
  return { ok: true, data: { id: data.id } };
}

export async function deleteService(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "services", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That service could not be found." };

  const [existing] = await db
    .select({ id: services.id, slug: services.slug, name: services.name, officeScope: services.officeScope })
    .from(services)
    .where(eq(services.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That service no longer exists." };
  requireScope(actor, existing.officeScope);

  await db.delete(services).where(eq(services.id, existing.id));
  await db.delete(uiStrings).where(inArray(uiStrings.key, stringKeys(existing.slug)));

  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "services",
    entityId: existing.id,
    summary: `deleted the service ${existing.name}`,
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(servicePath(existing.slug));
  revalidatePath("/");
  return { ok: true, data: { id: existing.id } };
}

export async function saveServiceFaqs(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "services", "update");

  const parsed = faqListSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the questions below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { ownerId, items } = parsed.data;

  const [owner] = await db
    .select({ id: services.id, slug: services.slug, name: services.name, officeScope: services.officeScope })
    .from(services)
    .where(eq(services.id, ownerId));
  if (!owner) return { ok: false, error: "That service no longer exists." };
  requireScope(actor, owner.officeScope);

  const kept = items.map((item) => item.id).filter(Boolean) as string[];
  const existing = await db
    .select({ id: serviceFaqs.id })
    .from(serviceFaqs)
    .where(eq(serviceFaqs.serviceId, owner.id));

  const removed = existing.filter((row) => !kept.includes(row.id)).map((row) => row.id);
  if (removed.length > 0) await db.delete(serviceFaqs).where(inArray(serviceFaqs.id, removed));

  for (const [index, item] of items.entries()) {
    const values = {
      serviceId: owner.id,
      question: item.question,
      answerHtml: sanitize(item.answerHtml),
      sortOrder: index,
      updatedBy: actor.id,
      updatedAt: new Date(),
    };
    if (item.id) {
      await db.update(serviceFaqs).set(values).where(eq(serviceFaqs.id, item.id));
    } else {
      await db.insert(serviceFaqs).values({ ...values, createdBy: actor.id });
    }
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "service_faqs",
    entityId: owner.id,
    summary: `saved ${items.length} questions on ${owner.name}`,
  });

  revalidatePath(servicePath(owner.slug));
  revalidatePath("/services");
  revalidatePath("/study-abroad");
  revalidatePath("/faq");
  revalidatePath("/");
  return { ok: true, data: { id: owner.id } };
}
