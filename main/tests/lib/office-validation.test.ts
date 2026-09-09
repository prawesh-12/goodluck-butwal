import { test, expect } from "vitest";
import { officePublishProblems, openingHoursSchema, updateOfficeSchema, type OfficeInput } from "@/features/offices/validators";

const week = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "09:00",
  close: "17:00",
  closed: day === 0 || day === 6,
}));

const office = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "melbourne",
  name: "Melbourne",
  country: "Australia",
  timezone: "Australia/Melbourne",
  addressLine1: "1 Example Street",
  city: "Melbourne",
  phone: "+61390000000",
  phoneDisplay: "(03) 9000 0000",
  email: "info@goodluck.services",
  openingHours: week,
  isActive: true,
  status: "published" as const,
  seoNoindex: false,
};

test("a full week of hours passes", () => {
  expect(openingHoursSchema.safeParse(week).success).toBe(true);
});

test("a closed day needs no opening or closing time", () => {
  const shut = week.map((row) => (row.day === 0 ? { ...row, open: "", close: "", closed: true } : row));
  expect(openingHoursSchema.safeParse(shut).success).toBe(true);
});

test("an open day without times is refused", () => {
  const broken = week.map((row) => (row.day === 1 ? { ...row, open: "", close: "" } : row));
  expect(openingHoursSchema.safeParse(broken).success).toBe(false);
});

test("closing before opening is refused", () => {
  const backwards = week.map((row) => (row.day === 1 ? { ...row, open: "17:00", close: "09:00" } : row));
  expect(openingHoursSchema.safeParse(backwards).success).toBe(false);
});

test("a week missing a day is refused", () => {
  expect(openingHoursSchema.safeParse(week.slice(1)).success).toBe(false);
});

test("a phone number that is not international is refused", () => {
  expect(updateOfficeSchema.safeParse({ ...office, phone: "03 9000 0000" }).success).toBe(false);
});

test("a map address that is not https is refused", () => {
  expect(updateOfficeSchema.safeParse({ ...office, mapsEmbedUrl: "http://maps.example" }).success).toBe(false);
});

test("a complete office has nothing blocking publication", () => {
  const parsed = updateOfficeSchema.parse(office);
  expect(officePublishProblems(parsed, {})).toEqual([]);
});

test("publishing names every missing field", () => {
  const parsed = updateOfficeSchema.parse({
    ...office,
    city: "",
    addressLine1: "",
    phone: "",
    phoneDisplay: "",
    email: "",
    openingHours: week.map((row) => ({ ...row, closed: true })),
  });
  expect(officePublishProblems(parsed, {})).toEqual([
    "City",
    "Street address",
    "Phone number",
    "Phone number as written on the site",
    "Email address",
    "At least one open day",
  ]);
});

test("an image with no alt text blocks publication", () => {
  const parsed: OfficeInput = updateOfficeSchema.parse({
    ...office,
    heroImageId: "22222222-2222-4222-8222-222222222222",
  });
  expect(officePublishProblems(parsed, { hero: null })).toEqual(["Alt text on the hero image"]);
  expect(officePublishProblems(parsed, { hero: "The Melbourne shopfront" })).toEqual([]);
});
