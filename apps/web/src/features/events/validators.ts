import { eventTypes } from "@/config/content-meta";
import { z } from "zod";
import { contentStatuses, httpsUrl, mediaId, slugField, text } from "@/lib/validators/fields";

const slugOrBlank = z.union([z.literal(""), slugField]).default("");

const optionalId = z.union([z.literal(""), z.uuid("Choose one from the list.")]).default("");

const localPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// What a datetime-local input sends. It is wall-clock time in the office's zone, not an instant.
const localDateTime = z
  .string()
  .trim()
  .refine((v) => v === "" || localPattern.test(v), "Give a date and a time.")
  .default("");

const fields = {
  title: z.string().trim().min(1, "Give the event a title."),
  slug: slugOrBlank,
  eventType: z.enum(eventTypes),
  officeId: optionalId,
  summary: text,
  descriptionHtml: z.string().default(""),
  coverImageId: mediaId,
  startsAt: localDateTime,
  endsAt: localDateTime,
  isOnline: z.boolean().default(false),
  onlineUrl: httpsUrl,
  venueName: text,
  venueAddress: text,
  mapsEmbedUrl: httpsUrl,
  capacity: z.number().int().positive("Capacity is a number of seats, or leave it empty.").nullable().default(null),
  registrationEnabled: z.boolean().default(true),
  registrationDeadline: localDateTime,
  status: z.enum(contentStatuses),
};

type Shape = {
  status: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string;
  isOnline: boolean;
  onlineUrl: string;
  venueName: string;
  venueAddress: string;
};

// All three times are wall clock in the same office, so a plain string compare orders them.
function checkEvent(data: Shape, ctx: z.RefinementCtx) {
  if (!data.startsAt) {
    ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Give the date and time it starts." });
  }
  if (data.endsAt && data.startsAt && data.endsAt <= data.startsAt) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end time must be after the start time." });
  }
  if (data.registrationDeadline && data.startsAt && data.registrationDeadline > data.startsAt) {
    ctx.addIssue({
      code: "custom",
      path: ["registrationDeadline"],
      message: "Registration has to close before the event starts.",
    });
  }

  if (data.isOnline) {
    if (!data.onlineUrl) {
      ctx.addIssue({ code: "custom", path: ["onlineUrl"], message: "An online event needs the link people join at." });
    }
    if (data.venueName || data.venueAddress) {
      ctx.addIssue({ code: "custom", path: ["venueName"], message: "An online event has no venue. Clear the venue fields." });
    }
    return;
  }

  if (!data.venueName) {
    ctx.addIssue({ code: "custom", path: ["venueName"], message: "Say where the event is held." });
  }
  if (data.onlineUrl) {
    ctx.addIssue({ code: "custom", path: ["onlineUrl"], message: "An event at a venue has no joining link. Clear it." });
  }
}

export const createEventSchema = z.object(fields).superRefine(checkEvent);
export const updateEventSchema = z.object({ id: z.uuid(), ...fields }).superRefine(checkEvent);

export type EventInput = z.infer<typeof createEventSchema>;

export type EventAltText = { cover?: string | null };

export function eventPublishProblems(data: EventInput, alt: EventAltText): string[] {
  const missing: string[] = [];
  if (!data.summary) missing.push("Summary");
  if (!data.descriptionHtml.trim()) missing.push("Description");
  // Every time on the page is rendered in the office's zone, so there has to be an office.
  if (!data.officeId) missing.push("Office");
  if (!data.coverImageId) missing.push("Cover image");
  if (data.coverImageId && !alt.cover) missing.push("Alt text on the cover image");
  if (data.isOnline && !data.onlineUrl) missing.push("Joining link");
  if (!data.isOnline && !data.venueName) missing.push("Venue");
  return missing;
}

const REGISTRATION_OFF = "This event is not taking registrations.";
export const REGISTRATION_CLOSED = "Registration for this event has closed.";
export const EVENT_FULL = "This event is full.";
export const ALREADY_REGISTERED = "You are already registered.";

export type RegistrationGate = {
  registrationEnabled: boolean;
  // Wall-clock deadlines are stored as instants, so these are Dates by the time they get here.
  registrationDeadline: Date | null;
  startsAt: Date;
  // null means unlimited.
  capacity: number | null;
  seatsTaken: number;
  attendees: number;
};

// Each refusal has its own words so a visitor is told which one it was.
export function registrationRefusal(gate: RegistrationGate, now: Date = new Date()): string | null {
  if (!gate.registrationEnabled) return REGISTRATION_OFF;

  // With no deadline set, registration closes when the event starts.
  const closesAt = gate.registrationDeadline ?? gate.startsAt;
  if (now.getTime() > closesAt.getTime()) return REGISTRATION_CLOSED;

  if (gate.capacity !== null && gate.seatsTaken + gate.attendees > gate.capacity) return EVENT_FULL;

  return null;
}

// The unique index settles a race a read-then-write cannot. A conflicting insert returns no row.
export function insertOutcome(inserted: unknown[]): { ok: true } | { ok: false; error: string } {
  return inserted.length > 0 ? { ok: true } : { ok: false, error: ALREADY_REGISTERED };
}

export const eventRegistrationSchema = z.object({
  fullName: z.string().trim().min(1, "Tell us your name."),
  email: z.email("Check the email address.").toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[+(0-9][0-9 ()\-.]{5,24}$/, "That does not look like a phone number.")
    .optional()
    .or(z.literal("")),
  attendees: z.number().int().min(1).max(10).default(1),
  notes: z.string().trim().optional(),
  sourcePage: z.string().optional(),
  turnstileToken: z.string().optional(),
  // Real people leave this empty. Bots fill everything in.
  company_website: z.string().optional(),
});

function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const wall = Date.UTC(at("year"), at("month") - 1, at("day"), at("hour") % 24, at("minute"), at("second"));
  return wall - instant.getTime();
}

// An admin types local time, not UTC. Two passes because the offset depends on the instant,
// which is what we are solving for.
export function zonedToUtc(local: string, timeZone: string): Date {
  const naive = Date.parse(`${local}:00Z`);
  const guess = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  return new Date(naive - zoneOffsetMs(guess, timeZone));
}

// The reverse, for filling a datetime-local input with the office's wall clock.
export function utcToZonedInput(instant: Date, timeZone: string): string {
  const shifted = new Date(instant.getTime() + zoneOffsetMs(instant, timeZone));
  return shifted.toISOString().slice(0, 16);
}
