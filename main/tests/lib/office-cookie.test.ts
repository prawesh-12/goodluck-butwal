import { test, expect } from "vitest";
import { readOfficeCookie, resolveOffice } from "@/lib/office-cookie";

const known = ["au", "np", "ph"];

test("a saved office beats the browser timezone", () => {
  expect(resolveOffice("np", "Australia/Melbourne", known)).toBe("np");
  expect(resolveOffice("au", "Asia/Kathmandu", known)).toBe("au");
});

test("the timezone decides when nothing is saved", () => {
  expect(resolveOffice(null, "Asia/Kathmandu", known)).toBe("np");
  expect(resolveOffice(null, "Asia/Katmandu", known)).toBe("np");
  expect(resolveOffice(null, "Europe/London", known)).toBe("au");
});

test("australia is the answer with no cookie and no timezone", () => {
  expect(resolveOffice(null, "", known)).toBe("au");
});

test("a cookie naming an office the site does not publish is ignored", () => {
  expect(resolveOffice("xx", "Asia/Kathmandu", known)).toBe("np");
  expect(resolveOffice("ph", "Europe/London", ["au", "np"])).toBe("au");
});

test("the office is read back out of a document cookie string", () => {
  expect(readOfficeCookie("a=1; gem_office=np; b=2")).toBe("np");
  expect(readOfficeCookie("gem_office=au")).toBe("au");
  expect(readOfficeCookie("other_gem_office=np")).toBe(null);
  expect(readOfficeCookie("")).toBe(null);
});
