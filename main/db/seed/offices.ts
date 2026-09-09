import { db } from "../client";
import { offices } from "../schema";
import { company, offices as source } from "../../src/lib/site";

// Every office takes these hours until the client gives its real ones.
const WEEKDAYS_10_TO_5 = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "10:00",
  close: "17:00",
  closed: day === 0 || day === 6,
}));

// The timezone each office renders its times in. Not in site.ts, and there is nowhere else
// to read it from.
const TIMEZONE: Record<string, string> = {
  au: "Australia/Melbourne",
  np: "Asia/Kathmandu",
  ph: "Asia/Manila",
};

const SLUG: Record<string, string> = {
  au: "melbourne",
  np: "butwal",
  ph: "cebu",
};

export async function seedOffices() {
  for (const [index, office] of source.entries()) {
    const row = {
      slug: SLUG[office.id],
      code: office.id,
      name: office.label,
      country: office.country,
      city: office.city,
      timezone: TIMEZONE[office.id],
      addressLine1: office.address,
      phone: office.tel.replace(/^tel:/, ""),
      phoneDisplay: office.phone,
      email: company.email,
      // Only the office that published hours gets them, so no contact card gains a line.
      openingHours: office.hours ? WEEKDAYS_10_TO_5 : null,
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
      isActive: true,
    };

    await db
      .insert(offices)
      .values(row)
      .onConflictDoUpdate({ target: offices.code, set: { ...row, updatedAt: new Date() } });
  }
  return source.length;
}
