import { test, expect } from "vitest";
import { createEventSchema, eventPublishProblems, utcToZonedInput, zonedToUtc } from "@/lib/validators/event";

const base = {
  title: "Placeholder event",
  slug: "placeholder-event",
  eventType: "seminar" as const,
  officeId: "",
  summary: "",
  descriptionHtml: "",
  coverImageId: "",
  startsAt: "2026-05-12T18:00",
  endsAt: "",
  isOnline: false,
  onlineUrl: "",
  venueName: "Placeholder venue",
  venueAddress: "",
  mapsEmbedUrl: "",
  capacity: null,
  registrationEnabled: true,
  registrationDeadline: "",
  status: "draft" as const,
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  seoOgImageId: "",
  seoNoindex: false,
  canonicalUrl: "",
};

const errorsOn = (input: Record<string, unknown>) => {
  const parsed = createEventSchema.safeParse(input);
  return parsed.success ? {} : parsed.error.flatten().fieldErrors;
};

test("a venue event is accepted", () => {
  expect(createEventSchema.safeParse(base).success).toBe(true);
});

test("an online event needs a URL and no venue", () => {
  const missingUrl = errorsOn({ ...base, isOnline: true, venueName: "", onlineUrl: "" });
  expect(missingUrl.onlineUrl?.[0]).toContain("link people join at");

  const withVenue = errorsOn({
    ...base,
    isOnline: true,
    onlineUrl: "https://example.com/join",
    venueName: "Placeholder venue",
  });
  expect(withVenue.venueName?.[0]).toContain("no venue");

  const good = { ...base, isOnline: true, venueName: "", onlineUrl: "https://example.com/join" };
  expect(createEventSchema.safeParse(good).success).toBe(true);
});

test("a venue event needs a venue and no URL", () => {
  expect(errorsOn({ ...base, venueName: "" }).venueName?.[0]).toContain("where the event is held");
  expect(errorsOn({ ...base, onlineUrl: "https://example.com/join" }).onlineUrl?.[0]).toContain("no joining link");
});

test("an end time before the start is refused", () => {
  expect(errorsOn({ ...base, endsAt: "2026-05-12T17:00" }).endsAt?.[0]).toContain("after the start");
  expect(createEventSchema.safeParse({ ...base, endsAt: "2026-05-12T20:00" }).success).toBe(true);
});

test("a start time is required", () => {
  expect(errorsOn({ ...base, startsAt: "" }).startsAt?.[0]).toContain("date and time it starts");
});

test("registration cannot close after the event starts", () => {
  const errors = errorsOn({ ...base, registrationDeadline: "2026-05-13T09:00" });
  expect(errors.registrationDeadline?.[0]).toContain("close before the event starts");
});

test("publish validation names every missing field", () => {
  const problems = eventPublishProblems(createEventSchema.parse(base), {});
  expect(problems).toEqual(["Summary", "Description", "Office", "Cover image"]);
});

test("publish validation names missing alt text on a chosen image", () => {
  const ready = createEventSchema.parse({
    ...base,
    summary: "A placeholder summary.",
    descriptionHtml: "<p>Placeholder.</p>",
    officeId: "3f7d6c1e-9a6f-4a1e-9c4a-2b0c1d5e6f70",
    coverImageId: "8c2f4b1a-7e3d-4c9b-8a5f-1d2e3f405162",
  });
  expect(eventPublishProblems(ready, {})).toEqual(["Alt text on the cover image"]);
  expect(eventPublishProblems(ready, { cover: "Two people at a desk" })).toEqual([]);
});

test("a typed time is stored as that wall clock in the office zone", () => {
  expect(zonedToUtc("2026-05-12T18:00", "Australia/Melbourne").toISOString()).toBe("2026-05-12T08:00:00.000Z");
  expect(zonedToUtc("2026-05-12T18:00", "Asia/Kathmandu").toISOString()).toBe("2026-05-12T12:15:00.000Z");
  // Melbourne is on daylight time in January, so the same wall clock is a different instant.
  expect(zonedToUtc("2026-01-12T18:00", "Australia/Melbourne").toISOString()).toBe("2026-01-12T07:00:00.000Z");
});

test("an instant comes back as the office wall clock", () => {
  const stored = zonedToUtc("2026-05-12T18:00", "Asia/Kathmandu");
  expect(utcToZonedInput(stored, "Asia/Kathmandu")).toBe("2026-05-12T18:00");
});
