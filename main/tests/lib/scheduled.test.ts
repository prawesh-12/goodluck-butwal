import { test, expect } from "vitest";
import { isDueToPublish } from "@/lib/utils/scheduled";

const now = new Date("2026-01-15T10:00:00Z");
const past = new Date("2026-01-15T09:45:00Z");
const future = new Date("2026-01-15T10:15:00Z");

test("a scheduled row whose date has passed is due", () => {
  expect(isDueToPublish({ status: "scheduled", publishedAt: past }, now)).toBe(true);
});

test("a scheduled row dated in the future is not due", () => {
  expect(isDueToPublish({ status: "scheduled", publishedAt: future }, now)).toBe(false);
});

test("a scheduled row with no date is not due", () => {
  expect(isDueToPublish({ status: "scheduled", publishedAt: null }, now)).toBe(false);
});

test("an already published row is not due", () => {
  expect(isDueToPublish({ status: "published", publishedAt: past }, now)).toBe(false);
});

test("a draft is not due", () => {
  expect(isDueToPublish({ status: "draft", publishedAt: past }, now)).toBe(false);
});

test("a scheduled testimonial without consent is not due", () => {
  expect(
    isDueToPublish({ status: "scheduled", publishedAt: past, consentGiven: false }, now),
  ).toBe(false);
});

test("a scheduled testimonial with consent is due", () => {
  expect(
    isDueToPublish({ status: "scheduled", publishedAt: past, consentGiven: true }, now),
  ).toBe(true);
});
