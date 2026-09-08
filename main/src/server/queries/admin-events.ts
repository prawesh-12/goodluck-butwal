import { and, asc, count, desc, eq, ilike, or, sum, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { eventRegistrations, events, offices } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";
import { eventTypes } from "@/lib/content-meta";

export const PAGE_SIZE = 25;

export type EventFilters = {
  q?: string;
  status?: string;
  office?: string;
  type?: string;
  event?: string;
  page?: number;
};

type Status = (typeof contentStatuses)[number];

function eventWhere(actor: Actor, f: EventFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(events, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(events.title, like), ilike(events.slug, like), ilike(events.summary, like)));
  }
  if (contentStatuses.includes(f.status as Status)) parts.push(eq(events.status, f.status as Status));
  if (eventTypes.includes(f.type as "seminar")) parts.push(eq(events.eventType, f.type as "seminar"));
  if (f.office) parts.push(eq(events.officeId, f.office));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminEvents(actor: Actor, f: EventFilters) {
  const where = eventWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total], taken] = await Promise.all([
    db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        eventType: events.eventType,
        status: events.status,
        startsAt: events.startsAt,
        capacity: events.capacity,
        registrationEnabled: events.registrationEnabled,
        office: offices.name,
        timezone: offices.timezone,
      })
      .from(events)
      .leftJoin(offices, eq(events.officeId, offices.id))
      .where(where)
      .orderBy(desc(events.startsAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(events).where(where),
    seatsTakenByEvent(),
  ]);

  return { rows: rows.map((row) => ({ ...row, seatsTaken: taken.get(row.id) ?? 0 })), total: total.n, page };
}

// Capacity counts seats, not rows: one registration can bring guests.
export async function seatsTakenByEvent() {
  const rows = await db
    .select({ eventId: eventRegistrations.eventId, seats: sum(eventRegistrations.attendees) })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.status, "registered"))
    .groupBy(eventRegistrations.eventId);
  return new Map(rows.map((row) => [row.eventId, Number(row.seats ?? 0)]));
}

export async function getAdminEvent(id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  return row;
}

export async function eventSlugs() {
  const rows = await db.select({ slug: events.slug }).from(events);
  return rows.map((row) => row.slug);
}

export async function officeZones() {
  return db
    .select({ id: offices.id, name: offices.name, timezone: offices.timezone })
    .from(offices)
    .orderBy(asc(offices.name));
}

export type OfficeZone = Awaited<ReturnType<typeof officeZones>>[number];

export async function officeTimezone(officeId: string | null) {
  if (!officeId) return "UTC";
  const [row] = await db.select({ timezone: offices.timezone }).from(offices).where(eq(offices.id, officeId));
  return row?.timezone ?? "UTC";
}

const registrationColumns = {
  id: eventRegistrations.id,
  fullName: eventRegistrations.fullName,
  email: eventRegistrations.email,
  phone: eventRegistrations.phone,
  attendees: eventRegistrations.attendees,
  notes: eventRegistrations.notes,
  status: eventRegistrations.status,
  sourcePage: eventRegistrations.sourcePage,
  createdAt: eventRegistrations.createdAt,
  event: events.title,
};

function registrationWhere(actor: Actor, f: EventFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(events, actor)];
  if (f.event) parts.push(eq(eventRegistrations.eventId, f.event));
  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(
      or(
        ilike(eventRegistrations.fullName, like),
        ilike(eventRegistrations.email, like),
        ilike(eventRegistrations.phone, like),
      ),
    );
  }
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listEventRegistrations(actor: Actor, f: EventFilters) {
  const where = registrationWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select(registrationColumns)
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(where)
      .orderBy(asc(eventRegistrations.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(where),
  ]);

  return { rows, total: total.n, page };
}

// The export runs the same scope and filter as the screen, so a download cannot reach further.
export async function exportEventRegistrations(actor: Actor, f: EventFilters) {
  return db
    .select(registrationColumns)
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(registrationWhere(actor, f))
    .orderBy(asc(eventRegistrations.createdAt));
}
