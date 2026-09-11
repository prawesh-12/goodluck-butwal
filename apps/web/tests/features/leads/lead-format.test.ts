import { test, expect } from "vitest";
import { dateLabel, submittedLabel, timeLabel } from "@/features/leads/components/lead-format";

test("a preferred date reads as a date", () => {
  expect(dateLabel("2026-03-12")).toBe("12 Mar 2026");
});

test("a preferred date does not slip to the day before", () => {
  expect(dateLabel("2026-01-01")).toBe("1 Jan 2026");
});

test("a missing preferred date says so", () => {
  expect(dateLabel(null)).toBe("Not set");
});

test("a preferred time reads as a clock time", () => {
  expect(timeLabel("14:30:00")).toBe("2:30 pm");
});

test("a morning time keeps its leading hour", () => {
  expect(timeLabel("09:00:00")).toBe("9:00 am");
});

test("a missing preferred time says so", () => {
  expect(timeLabel(null)).toBe("Not set");
});

test("a submitted timestamp reads in the office day, not the stored one", () => {
  expect(submittedLabel(new Date("2026-03-11T14:00:00Z"))).toBe("12 Mar 2026");
});
