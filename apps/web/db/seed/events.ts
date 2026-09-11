import { asc, ne } from "drizzle-orm";
import { db } from "@goodluck/db";
import { events, mediaAssets, offices } from "@goodluck/db/schema";

// There is no real event list yet. These exist so the events screens have something to open in
// development. Every one says so in its own title, they are created only under --dev, and they
// stay drafts so nothing reaches the site. Same rule as the catalogue seed.
const PLACEHOLDER = "[PLACEHOLDER]";
const DEV = process.argv.includes("--dev");

const drafts = [
  {
    slug: "placeholder-upcoming-seminar",
    title: `${PLACEHOLDER} Upcoming seminar`,
    eventType: "seminar" as const,
    officeCode: "au",
    inDays: 21,
    hour: 18,
    durationHours: 2,
    isOnline: false,
    capacity: 40,
  },
  {
    slug: "placeholder-upcoming-webinar",
    title: `${PLACEHOLDER} Upcoming webinar`,
    eventType: "webinar" as const,
    officeCode: "np",
    inDays: 35,
    hour: 17,
    durationHours: 1,
    isOnline: true,
    capacity: null,
  },
  {
    slug: "placeholder-past-education-fair",
    title: `${PLACEHOLDER} Past education fair`,
    eventType: "education_fair" as const,
    officeCode: "au",
    inDays: -30,
    hour: 10,
    durationHours: 6,
    isOnline: false,
    capacity: 100,
  },
];

const at = (days: number, hour: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

export async function seedEvents() {
  if (!DEV) return 0;

  const officeRows = await db.select({ id: offices.id, code: offices.code }).from(offices);
  const officeId = new Map(officeRows.map((row) => [row.code, row.id]));

  // Any described picture will do: these rows are thrown away when the real events arrive.
  const [cover] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(ne(mediaAssets.altText, ""))
    .orderBy(asc(mediaAssets.createdAt))
    .limit(1);

  for (const [index, draft] of drafts.entries()) {
    const startsAt = at(draft.inDays, draft.hour);
    const row = {
      slug: draft.slug,
      title: draft.title,
      eventType: draft.eventType,
      officeId: officeId.get(draft.officeCode) ?? null,
      summary: `${PLACEHOLDER} Replace this event before it goes live.`,
      descriptionHtml: `<p>${PLACEHOLDER} There is no approved copy for this event yet.</p>`,
      coverImageId: cover?.id ?? null,
      startsAt,
      endsAt: new Date(startsAt.getTime() + draft.durationHours * 60 * 60 * 1000),
      isOnline: draft.isOnline,
      onlineUrl: draft.isOnline ? "https://example.com/placeholder-joining-link" : null,
      venueName: draft.isOnline ? null : `${PLACEHOLDER} venue`,
      venueAddress: null,
      mapsEmbedUrl: null,
      capacity: draft.capacity,
      registrationEnabled: true,
      registrationDeadline: null,
      status: "draft" as const,
      publishedAt: null,
      sortOrder: index,
    };

    await db
      .insert(events)
      .values(row)
      .onConflictDoUpdate({ target: events.slug, set: { ...row, updatedAt: new Date() } });
  }

  return drafts.length;
}
