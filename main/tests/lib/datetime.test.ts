import { test, expect } from "vitest";
import { formatDate, formatInOfficeTz } from "@/lib/datetime";

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
