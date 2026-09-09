import { cache } from "react";
import { and, asc, eq, sum } from "drizzle-orm";
import { db } from "@db/client";
import { eventRegistrations, events, mediaAssets, offices } from "@db/schema";
import { mediaUrl } from "./catalogue";
import { eventTypeLabels, type EventType } from "@/lib/content-meta";
import { formatInOfficeTz } from "@/lib/datetime";
import { utcToZonedInput } from "@/lib/validators/event";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  eventType: EventType;
  summary: string;
  html: string;
  image: string;
  startsAt: Date;
  endsAt: Date | null;
  isOnline: boolean;
  onlineUrl: string | null;
  venueName: string | null;
  venueAddress: string | null;
  mapsEmbedUrl: string | null;
  capacity: number | null;
  registrationEnabled: boolean;
  registrationDeadline: Date | null;
  officeCode: string;
  officeName: string;
  timezone: string;
};

export const listEvents = cache(async (): Promise<PublicEvent[]> => {
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      eventType: events.eventType,
      summary: events.summary,
      html: events.descriptionHtml,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      isOnline: events.isOnline,
      onlineUrl: events.onlineUrl,
      venueName: events.venueName,
      venueAddress: events.venueAddress,
      mapsEmbedUrl: events.mapsEmbedUrl,
      capacity: events.capacity,
      registrationEnabled: events.registrationEnabled,
      registrationDeadline: events.registrationDeadline,
      officeCode: offices.code,
      officeName: offices.name,
      timezone: offices.timezone,
    })
    .from(events)
    .leftJoin(mediaAssets, eq(events.coverImageId, mediaAssets.id))
    .leftJoin(offices, eq(events.officeId, offices.id))
    .where(eq(events.status, "published"))
    .orderBy(asc(events.startsAt));

  return rows.map((row) => ({
    ...row,
    summary: row.summary ?? "",
    html: row.html ?? "",
    image: mediaUrl(row, 960),
    officeCode: row.officeCode ?? "",
    officeName: row.officeName ?? "",
    // Every published event has an office, so this fallback only ever covers a draft made live
    // by hand in the database.
    timezone: row.timezone ?? "UTC",
  }));
});

export const getEvent = cache(async (slug: string) => (await listEvents()).find((e) => e.slug === slug));

// Capacity counts seats, not rows: one registration can bring guests.
export async function seatsTaken(eventId: string) {
  const [row] = await db
    .select({ seats: sum(eventRegistrations.attendees) })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, "registered")));
  return Number(row?.seats ?? 0);
}

export type EventCard = {
  article: { slug: string; title: string; date: string; category: string; image: string; excerpt: string };
  when: string;
  place: string;
  past: boolean;
};

// The list page. Times are formatted here, in the office that owns the event, and whether an
// event has been and gone is decided here too rather than while a page renders.
export const listEventCards = cache(async (): Promise<EventCard[]> => {
  const now = Date.now();
  return (await listEvents()).map((event) => ({
    article: {
      slug: event.slug,
      title: event.title,
      // The date on the card is the date at the office, not the date in UTC.
      date: utcToZonedInput(event.startsAt, event.timezone).slice(0, 10),
      category: eventTypeLabels[event.eventType],
      image: event.image,
      excerpt: event.summary,
    },
    when: formatInOfficeTz(event.startsAt, event.timezone),
    place: event.isOnline ? "Online" : (event.venueName ?? event.officeName),
    past: event.startsAt.getTime() < now,
  }));
});

export type UpcomingEvent = {
  slug: string;
  title: string;
  image: string;
  date: string;
  kind: string;
  when: string;
  place: string;
  officeCode: string;
};

// The home page block. Formatting happens here because the office time zone is a server fact,
// and the block itself only decides which office the visitor is seeing.
export const listUpcomingEvents = cache(async (): Promise<UpcomingEvent[]> => {
  const now = Date.now();
  return (await listEvents())
    .filter((event) => event.startsAt.getTime() >= now)
    .slice(0, 9)
    .map((event) => ({
      slug: event.slug,
      title: event.title,
      image: event.image,
      date: utcToZonedInput(event.startsAt, event.timezone).slice(0, 10),
      kind: eventTypeLabels[event.eventType],
      when: formatInOfficeTz(event.startsAt, event.timezone),
      place: event.isOnline ? "Online" : (event.venueName ?? event.officeName),
      officeCode: event.officeCode,
    }));
});
