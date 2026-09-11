import { cache } from "react";
import { asc, eq, like } from "drizzle-orm";
import { db } from "@db/client";
import { destinations, uiStrings } from "@db/schema";
import { destinationArt } from "@/config/assets";

export type PublicDestination = {
  slug: string;
  name: string;
  flag: string;
  card: string;
  hero: string;
  heroAlt: string;
  overview: string;
  highlights: { title: string; line: string }[];
  academic: string;
  work: string;
  migrationTitle: string;
  migration: { title: string; line: string }[];
  whyTitle: string;
  why: string[];
  costs?: { title: string; line: string }[];
  checklistTitle?: string;
  checklist?: string[];
  help: { title: string; line: string }[];
  hasPage: boolean;
};

export type FaqItem = { q: string; a: string };

export const listDestinations = cache(async (): Promise<PublicDestination[]> => {
  const [rows, strings] = await Promise.all([
    db
      .select({
        slug: destinations.slug,
        name: destinations.name,
        overviewHtml: destinations.overviewHtml,
        highlights: destinations.highlights,
        academicHtml: destinations.academicHtml,
        workHtml: destinations.workHtml,
        migration: destinations.migration,
        why: destinations.why,
        costs: destinations.costs,
        checklist: destinations.checklist,
        help: destinations.help,
        hasPage: destinations.hasPage,
      })
      .from(destinations)
      .where(eq(destinations.status, "published"))
      .orderBy(asc(destinations.sortOrder)),
    db
      .select({ key: uiStrings.key, value: uiStrings.value })
      .from(uiStrings)
      .where(like(uiStrings.key, "destination.%")),
  ]);

  const text = new Map(strings.map((s) => [s.key, s.value]));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    ...(destinationArt[row.slug] ?? { flag: "", card: "", hero: "", heroAlt: "" }),
    overview: row.overviewHtml ?? "",
    highlights: (row.highlights ?? []).map((h) => ({ title: h.label, line: h.value })),
    academic: row.academicHtml ?? "",
    work: row.workHtml ?? "",
    migrationTitle: text.get(`destination.${row.slug}.migrationTitle`) ?? "",
    migration: (row.migration ?? []).map((m) => ({ title: m.title, line: m.body })),
    whyTitle: text.get(`destination.${row.slug}.whyTitle`) ?? "",
    why: (row.why ?? []).map((w) => w.text),
    costs: row.costs?.map((c) => ({ title: c.label, line: c.note ?? "" })),
    checklistTitle: text.get(`destination.${row.slug}.checklistTitle`),
    checklist: row.checklist?.map((c) => c.text),
    help: (row.help ?? []).map((h) => ({ title: h.title, line: h.body })),
    hasPage: row.hasPage,
  }));
});

export const getDestination = cache(async (slug: string) =>
  (await listDestinations()).find((d) => d.slug === slug && d.hasPage),
);

// The accordions read questions by the service that owns them.
