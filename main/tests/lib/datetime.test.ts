import { test, expect } from "vitest";
import { formatDate, formatInOfficeTz, officeSlot } from "@/lib/utils/datetime";

test("formats an article date the way the news pages already show it", () => {
  expect(formatDate("2025-03-14")).toBe("14 March 2025");
});

// Melbourne is already into 1 July at this instant while Kathmandu is still on 30 June. If the
// office zone is ever ignored, this is the pair that catches it.
test("the same instant lands on different days in the two offices", () => {
  const instant = "2025-06-30T16:00:00Z";
  expect(formatInOfficeTz(instant, "Australia/Melbourne")).toContain("1 July 2025");
  expect(formatInOfficeTz(instant, "Asia/Kathmandu")).toContain("30 June 2025");
});

test("always names the zone, so a time is never ambiguous", () => {
  const out = formatInOfficeTz("2025-06-30T02:00:00Z", "Australia/Melbourne");
  expect(out).toMatch(/GMT|AEST|AEDT/);
});

test("accepts a Date as well as a string", () => {
  const instant = new Date("2025-06-30T02:00:00Z");
  expect(formatInOfficeTz(instant, "Asia/Kathmandu")).toBe(
    formatInOfficeTz("2025-06-30T02:00:00Z", "Asia/Kathmandu"),
  );
});

// Confirming a consultation threw RangeError for every row: a form sends HH:MM and Postgres
// hands the same column back as HH:MM:SS, and both were pasted into a template that appended
// its own seconds.
test("a time from the database and a time from the form land on the same instant", () => {
  const fromDb = officeSlot("2026-10-15", "11:00:00");
  const fromForm = officeSlot("2026-10-15", "11:00");

  expect(fromDb).not.toBeNull();
  expect(fromDb!.toISOString()).toBe("2026-10-15T11:00:00.000Z");
  expect(fromForm!.toISOString()).toBe(fromDb!.toISOString());
});

test("a slot formats in the office zone instead of throwing", () => {
  const at = officeSlot("2026-10-15", "11:00:00")!;
  expect(() => formatInOfficeTz(at, "Australia/Melbourne")).not.toThrow();
  expect(formatInOfficeTz(at, "Australia/Melbourne")).toContain("2026");
});

test("a missing or unparseable date or time gives nothing back rather than an invalid date", () => {
  expect(officeSlot(null, "11:00:00")).toBeNull();
  expect(officeSlot("2026-10-15", null)).toBeNull();
  expect(officeSlot("2026-10-15", "")).toBeNull();
  expect(officeSlot("not-a-date", "11:00:00")).toBeNull();
});
