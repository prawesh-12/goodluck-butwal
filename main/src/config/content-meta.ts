// Kept out of the Zod schemas: a client component importing a validator drags zod into the
// browser bundle.

export const EXCERPT_MAX = 200;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const eventTypes = [
  "seminar",
  "education_fair",
  "webinar",
  "workshop",
  "info_session",
] as const;
export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  seminar: "Seminar",
  education_fair: "Education fair",
  webinar: "Webinar",
  workshop: "Workshop",
  info_session: "Info session",
};
