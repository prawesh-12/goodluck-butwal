"use server";

import { revalidatePath } from "next/cache";
import { revalidateSitemap } from "@/lib/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { events, redirects } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { can, requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import {
  createEventSchema,
  eventPublishProblems,
  updateEventSchema,
  zonedToUtc,
  type EventInput,
} from "@/features/events/validators";
import { mediaAlt } from "@/features/media/admin-queries";
import { eventSlugs, officeTimezone } from "@/features/events/admin-queries";

type Result =
  | { ok: true; data: { id: string; slug: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

const goesLive = (status: string) => status === "published";

async function publishProblems(data: EventInput) {
  const alt = await mediaAlt([data.coverImageId]);
  return eventPublishProblems(data, { cover: alt.get(data.coverImageId) });
}

function publishedDate(data: EventInput, existing: Date | null) {
  return data.status === "published" ? (existing ?? new Date()) : existing;
}

// The three times are typed as the office's wall clock and stored as instants.
function columns(data: EventInput, slug: string, html: string, timeZone: string, existingDate: Date | null) {
  return {
    slug,
    title: data.title,
    eventType: data.eventType,
    officeId: blank(data.officeId),
    summary: blank(data.summary),
    descriptionHtml: html,
    coverImageId: blank(data.coverImageId),
    startsAt: zonedToUtc(data.startsAt, timeZone),
    endsAt: data.endsAt ? zonedToUtc(data.endsAt, timeZone) : null,
    isOnline: data.isOnline,
    onlineUrl: blank(data.onlineUrl),
    venueName: blank(data.venueName),
    venueAddress: blank(data.venueAddress),
    mapsEmbedUrl: blank(data.mapsEmbedUrl),
    capacity: data.capacity,
    registrationEnabled: data.registrationEnabled,
    registrationDeadline: data.registrationDeadline ? zonedToUtc(data.registrationDeadline, timeZone) : null,
    status: data.status,
    publishedAt: publishedDate(data, existingDate),
  };
}

function refresh(slugs: string[]) {
  revalidateSitemap();
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  for (const slug of slugs) revalidatePath(`/events/${slug}`);
}

export async function createEvent(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "events", "create");

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (goesLive(data.status) && !can(actor, "events", "publish")) {
    return { ok: false, error: "You cannot publish. Save it as a draft and ask an admin." };
  }
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) {
      return { ok: false, error: `Not ready to publish. Add: ${problems.join(", ")}.` };
    }
  }

  const timeZone = await officeTimezone(blank(data.officeId));
  const html = sanitize(data.descriptionHtml);
  const slug = uniqueSlug(data.slug || data.title, await eventSlugs());

  const [created] = await db
    .insert(events)
    .values({ ...columns(data, slug, html, timeZone, null), createdBy: actor.id, updatedBy: actor.id })
    .returning({ id: events.id, slug: events.slug });

  refresh([created.slug]);
  return { ok: true, data: created };
}

export async function updateEvent(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "events", "update");

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: events.id,
      slug: events.slug,
      status: events.status,
      officeId: events.officeId,
      publishedAt: events.publishedAt,
    })
    .from(events)
    .where(eq(events.id, data.id));
  if (!existing) return { ok: false, error: "That event no longer exists." };

  // Checked on the loaded row, never on the id that came from the form.
  requireOwnership(actor, existing);
  requireOwnership(actor, { officeId: blank(data.officeId) });

  if (data.status !== existing.status && !can(actor, "events", "publish")) {
    return { ok: false, error: "You cannot change whether an event is live. Ask an admin." };
  }

  if (goesLive(data.status)) {
    const problems = await publishProblems(data);
    if (problems.length > 0) {
      return { ok: false, error: `Not ready to publish. Add: ${problems.join(", ")}.` };
    }
  }

  const timeZone = await officeTimezone(blank(data.officeId));
  const html = sanitize(data.descriptionHtml);
  const slug = data.slug
    ? uniqueSlug(data.slug, (await eventSlugs()).filter((taken) => taken !== existing.slug))
    : existing.slug;

  await db
    .update(events)
    .set({ ...columns(data, slug, html, timeZone, existing.publishedAt), updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(events.id, data.id));

  // A live address that changes leaves a 301 behind rather than a dead link.
  if (existing.status === "published" && slug !== existing.slug) {
    await db
      .insert(redirects)
      .values({
        fromPath: `/events/${existing.slug}`,
        toPath: `/events/${slug}`,
        statusCode: 301,
        note: `The event moved from ${existing.slug}.`,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: `/events/${slug}`, isActive: true, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

  refresh([slug, existing.slug]);
  return { ok: true, data: { id: data.id, slug } };
}

export async function archiveEvent(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "events", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That event could not be found." };

  const [existing] = await db
    .select({ slug: events.slug, officeId: events.officeId })
    .from(events)
    .where(eq(events.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That event no longer exists." };
  requireOwnership(actor, existing);

  await db
    .update(events)
    .set({ status: "archived", updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(events.id, parsed.data.id));

  refresh([existing.slug]);
  return { ok: true, data: { id: parsed.data.id, slug: existing.slug } };
}
