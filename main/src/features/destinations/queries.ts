import { cache } from "react";
import { asc, eq, inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { destinations, mediaAssets, uiStrings } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";

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

const hero = mediaAssets;

export const listDestinations = cache(async (): Promise<PublicDestination[]> => {
  const [rows, strings] = await Promise.all([
    db
      .select({
        slug: destinations.slug,
        name: destinations.name,
        flagImageId: destinations.flagImageId,
        cardImageId: destinations.cardImageId,
        heroImageId: destinations.heroImageId,
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

  const wanted = [...new Set(
    rows.flatMap((row) => [row.flagImageId, row.cardImageId, row.heroImageId])
      .filter((id): id is string => Boolean(id)),
  )];
  const paths = wanted.length
    ? await db
        .select({
          id: hero.id,
          kind: hero.kind,
          staticPath: hero.staticPath,
          cloudinaryPublicId: hero.cloudinaryPublicId,
          alt: hero.altText,
        })
        .from(hero)
        .where(inArray(hero.id, wanted))
    : [];

  const text = new Map(strings.map((s) => [s.key, s.value]));
  const media = new Map(paths.map((m) => [m.id, m]));
  const path = (id: string | null, width: number) => {
    const row = id ? media.get(id) : undefined;
    return row ? mediaUrl(row, width) : "";
  };

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    flag: path(row.flagImageId, 320),
    card: path(row.cardImageId, 640),
    hero: path(row.heroImageId, 1920),
    heroAlt: row.heroImageId ? (media.get(row.heroImageId)?.alt ?? "") : "",
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
