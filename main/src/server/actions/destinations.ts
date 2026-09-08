"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { destinationFaqs, destinations, redirects, uiStrings } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requirePermission, type Actor } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import { mediaAlt, slugsInUse } from "@/server/queries/admin-content";
import {
  createDestinationSchema,
  destinationPath,
  destinationPublishProblems,
  updateDestinationSchema,
  type DestinationInput,
} from "@/lib/validators/destination";
import { missingAltProblems, publishRefusal, seoValues, slugRedirect, type AttachedImage } from "@/lib/validators/page";
import { faqListSchema } from "@/lib/validators/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const GOING_LIVE = new Set(["published", "scheduled"]);

// The three section headings have no column, so they are kept as interface text keyed on the slug.
const HEADINGS = [
  { field: "migrationTitle", label: "migration heading", help: "Heading above the migration blocks." },
  { field: "whyTitle", label: "reasons heading", help: "Heading above the reasons to study there." },
  { field: "checklistTitle", label: "checklist heading", help: "Heading above the checklist." },
] as const;

function rowValues(data: DestinationInput) {
  return {
    name: data.name,
    countryCode: data.countryCode || null,
    tagline: data.tagline || null,
    heroImageId: data.heroImageId,
    flagImageId: data.flagImageId,
    cardImageId: data.cardImageId,
    factPill: data.factPill || null,
    overviewHtml: sanitize(data.overviewHtml) || null,
    academicHtml: sanitize(data.academicHtml) || null,
    workHtml: sanitize(data.workHtml) || null,
    isFeatured: data.isFeatured,
    hasPage: data.hasPage,
    status: data.status,
    sortOrder: data.sortOrder,
    highlights: data.highlights,
    why: data.why,
    checklist: data.checklist,
    intakes: data.intakes,
    migration: data.migration,
    costs: data.costs,
    help: data.help,
    ...seoValues(data),
  };
}

async function publishProblems(data: DestinationInput) {
  const images = [
    { label: "The hero image", id: data.heroImageId },
    { label: "The card image", id: data.cardImageId },
    { label: "The flag image", id: data.flagImageId },
    { label: "The share image", id: data.seoOgImageId },
  ].filter((image) => image.id) as { label: string; id: string }[];

  const alt = await mediaAlt(images.map((image) => image.id));
  const described: AttachedImage[] = images.map((image) => ({ ...image, altText: alt.get(image.id) ?? null }));

  return [...destinationPublishProblems(data), ...missingAltProblems(described)];
}

async function saveHeadings(actor: Actor, data: DestinationInput, slug: string) {
  for (const heading of HEADINGS) {
    const key = `destination.${slug}.${heading.field}`;
    const value = data[heading.field];
    await db
      .insert(uiStrings)
      .values({
        key,
        value,
        group: "destinations",
        label: `${data.name} ${heading.label}`,
        help: heading.help,
      })
      .onConflictDoUpdate({
        target: uiStrings.key,
        set: { value, label: `${data.name} ${heading.label}`, updatedBy: actor.id, updatedAt: new Date() },
      });
  }
}

export async function createDestination(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "destinations", "create");

  const parsed = createDestinationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;
  const slug = uniqueSlug(data.slug, await slugsInUse("destinations"));

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "destinations", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const [row] = await db
    .insert(destinations)
    .values({
      ...rowValues(data),
      slug,
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: destinations.id });

  await saveHeadings(actor, data, slug);
  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "destinations",
    entityId: row.id,
    summary: `created the destination ${data.name}`,
  });

  revalidatePath("/admin/destinations");
  revalidatePath("/study-abroad");
  revalidatePath(destinationPath(slug));
  return { ok: true, data: { id: row.id } };
}

export async function updateDestination(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "destinations", "update");

  const parsed = updateDestinationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db.select().from(destinations).where(eq(destinations.id, data.id));
  if (!existing) return { ok: false, error: "That destination no longer exists." };

  const taken = await slugsInUse("destinations", existing.id);
  if (taken.includes(data.slug)) {
    return {
      ok: false,
      error: "Check the fields below.",
      fieldErrors: { slug: ["Another destination already uses that address."] },
    };
  }

  if (GOING_LIVE.has(data.status)) {
    requirePermission(actor, "destinations", "publish");
    const problems = await publishProblems(data);
    if (problems.length > 0) return publishRefusal(problems);
  }

  const before = destinationPath(existing.slug);
  const after = destinationPath(data.slug);
  const redirect = slugRedirect(before, after, existing.status === "published");
  if (redirect) {
    await db
      .insert(redirects)
      .values({ ...redirect, createdBy: actor.id, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: redirect.toPath, isActive: true, note: redirect.note, updatedBy: actor.id, updatedAt: new Date() },
      });
    // The headings are keyed on the slug, so the old keys would be orphans.
    await db.delete(uiStrings).where(
      inArray(
        uiStrings.key,
        HEADINGS.map((h) => `destination.${existing.slug}.${h.field}`),
      ),
    );
  }

  await db
    .update(destinations)
    .set({
      ...rowValues(data),
      slug: data.slug,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(destinations.id, data.id));

  await saveHeadings(actor, data, data.slug);
  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "destinations",
    entityId: data.id,
    summary: `saved the destination ${data.name}`,
  });

  revalidatePath("/admin/destinations");
  revalidatePath("/study-abroad");
  revalidatePath(before);
  if (after !== before) revalidatePath(after);
  return { ok: true, data: { id: data.id } };
}

export async function deleteDestination(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "destinations", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That destination could not be found." };

  const [existing] = await db
    .select({ id: destinations.id, slug: destinations.slug, name: destinations.name })
    .from(destinations)
    .where(eq(destinations.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That destination no longer exists." };

  await db.delete(destinations).where(eq(destinations.id, existing.id));
  await db.delete(uiStrings).where(
    inArray(
      uiStrings.key,
      HEADINGS.map((h) => `destination.${existing.slug}.${h.field}`),
    ),
  );

  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "destinations",
    entityId: existing.id,
    summary: `deleted the destination ${existing.name}`,
  });

  revalidatePath("/admin/destinations");
  revalidatePath("/study-abroad");
  revalidatePath(destinationPath(existing.slug));
  return { ok: true, data: { id: existing.id } };
}

export async function saveDestinationFaqs(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "destinations", "update");

  const parsed = faqListSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the questions below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { ownerId, items } = parsed.data;

  const [owner] = await db
    .select({ id: destinations.id, slug: destinations.slug, name: destinations.name })
    .from(destinations)
    .where(eq(destinations.id, ownerId));
  if (!owner) return { ok: false, error: "That destination no longer exists." };

  const kept = items.map((item) => item.id).filter(Boolean) as string[];
  const existing = await db
    .select({ id: destinationFaqs.id })
    .from(destinationFaqs)
    .where(eq(destinationFaqs.destinationId, owner.id));

  const removed = existing.filter((row) => !kept.includes(row.id)).map((row) => row.id);
  if (removed.length > 0) await db.delete(destinationFaqs).where(inArray(destinationFaqs.id, removed));

  for (const [index, item] of items.entries()) {
    const values = {
      destinationId: owner.id,
      question: item.question,
      answerHtml: sanitize(item.answerHtml),
      sortOrder: index,
      updatedBy: actor.id,
      updatedAt: new Date(),
    };
    if (item.id) {
      await db.update(destinationFaqs).set(values).where(eq(destinationFaqs.id, item.id));
    } else {
      await db.insert(destinationFaqs).values({ ...values, createdBy: actor.id });
    }
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "destination_faqs",
    entityId: owner.id,
    summary: `saved ${items.length} questions on ${owner.name}`,
  });

  revalidatePath(destinationPath(owner.slug));
  revalidatePath("/faq");
  return { ok: true, data: { id: owner.id } };
}
