import { test, expect } from "vitest";
import { formatOpeningHours } from "@/lib/datetime";

const weekdays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "10:00",
  close: "17:00",
  closed: day === 0 || day === 6,
}));

test("renders the line the contact card used to hard-code", () => {
  expect(formatOpeningHours(weekdays)).toBe("Mon - Fri: 10 am to 5 pm");
});

test("an office with no hours renders nothing", () => {
  expect(formatOpeningHours(null)).toBe(null);
  expect(formatOpeningHours(weekdays.map((h) => ({ ...h, closed: true })))).toBe(null);
});

test("keeps the minutes when there are any", () => {
  const half = weekdays.map((h) => ({ ...h, open: "09:30", close: "17:45" }));
  expect(formatOpeningHours(half)).toBe("Mon - Fri: 9:30 am to 5:45 pm");
});

test("lists the days when they are not a run", () => {
  const split = weekdays.map((h) => ({ ...h, closed: ![1, 3, 5].includes(h.day) }));
  expect(formatOpeningHours(split)).toBe("Mon, Wed, Fri: 10 am to 5 pm");
});

test("a single open day is named on its own", () => {
  const one = weekdays.map((h) => ({ ...h, closed: h.day !== 6 }));
  expect(formatOpeningHours(one)).toBe("Sat: 10 am to 5 pm");
});
