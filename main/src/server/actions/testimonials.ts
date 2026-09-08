"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { testimonials } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can, requireOwnership, requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import {
  createTestimonialSchema,
  publicIdentity,
  testimonialPublishProblems,
  updateTestimonialSchema,
  type TestimonialInput,
} from "@/lib/validators/testimonial";
import { altTextByIds } from "@/server/queries/admin-people";

type Result =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

const goesLive = (status: string) => status === "published" || status === "scheduled";

async function publishProblems(data: TestimonialInput) {
  const alt = await altTextByIds([data.imageId, data.authorPhotoId]);
  return testimonialPublishProblems(data, {
    image: alt.get(data.imageId),
    photo: alt.get(data.authorPhotoId),
  });
}

function columns(data: TestimonialInput, bodyHtml: string, existingDate: Date | null) {
  const identity = publicIdentity(data);
  return {
    type: data.type,
    authorName: blank(data.authorName),
    displayName: identity.displayName || null,
    isAnonymised: data.isAnonymised,
    authorPhotoId: identity.authorPhotoId,
    authorLocation: blank(data.authorLocation),
    quote: blank(data.quote),
    bodyHtml,
    imageId: blank(data.imageId),
    videoUrl: blank(data.videoUrl),
    videoProvider: data.videoProvider || null,
    destinationId: blank(data.destinationId),
    institutionId: blank(data.institutionId),
    serviceId: blank(data.serviceId),
    officeId: blank(data.officeId),
    rating: data.rating,
    isFeatured: data.isFeatured,
    consentGiven: data.consentGiven,
    consentNote: blank(data.consentNote),
    status: data.status,
    publishedAt: data.publishedAt
      ? new Date(data.publishedAt)
      : data.status === "published"
        ? (existingDate ?? new Date())
        : existingDate,
  };
}

function refresh() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/success-stories");
  revalidatePath("/");
}

export async function createTestimonial(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "testimonials", "create");

  const parsed = createTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (goesLive(data.status) && !can(actor, "testimonials", "publish")) {
    return { ok: false, error: "You cannot publish. Save it as a draft and ask an admin." };
  }
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) return { ok: false, error: problems.join(" ") };
  }

  const [created] = await db
    .insert(testimonials)
    .values({
      ...columns(data, sanitize(data.bodyHtml), null),
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: testimonials.id });

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" ? "publish" : "create",
    entityType: "testimonials",
    entityId: created.id,
    summary: `added a ${data.type} story from ${data.displayName || data.authorName || "someone"}`,
  });

  refresh();
  return { ok: true, data: created };
}

export async function updateTestimonial(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "testimonials", "update");

  const parsed = updateTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: testimonials.id,
      officeId: testimonials.officeId,
      status: testimonials.status,
      publishedAt: testimonials.publishedAt,
    })
    .from(testimonials)
    .where(eq(testimonials.id, data.id));
  if (!existing) return { ok: false, error: "That story no longer exists." };

  // Checked on the loaded row, never on the id that came from the form.
  requireOwnership(actor, existing);
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (data.status !== existing.status && !can(actor, "testimonials", "publish")) {
    return { ok: false, error: "You cannot change whether a story is live. Ask an admin." };
  }

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) return { ok: false, error: problems.join(" ") };
  }

  await db
    .update(testimonials)
    .set({
      ...columns(data, sanitize(data.bodyHtml), existing.publishedAt),
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(testimonials.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: data.status === "published" && existing.status !== "published" ? "publish" : "update",
    entityType: "testimonials",
    entityId: data.id,
    summary: `updated a ${data.type} story`,
  });

  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function archiveTestimonial(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "testimonials", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That story could not be found." };

  const [existing] = await db
    .select({ officeId: testimonials.officeId, displayName: testimonials.displayName })
    .from(testimonials)
    .where(eq(testimonials.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That story no longer exists." };
  requireOwnership(actor, existing);

  await db
    .update(testimonials)
    .set({ status: "archived", updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(testimonials.id, parsed.data.id));

  await writeAudit({
    userId: actor.id,
    action: "unpublish",
    entityType: "testimonials",
    entityId: parsed.data.id,
    summary: `archived the story from ${existing.displayName ?? "someone"}`,
  });

  refresh();
  return { ok: true, data: { id: parsed.data.id } };
}
