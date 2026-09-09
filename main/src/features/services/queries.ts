import { cache } from "react";
import { asc, eq, inArray, like } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, serviceFaqs, services, uiStrings } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";
import type { FaqItem } from "@/features/destinations/queries";

// The shape the approved service pages already render.
export type PublicService = {
  slug: string;
  title: string;
  label: string;
  line: string;
  intro: string;
  image: string;
  imageAlt: string;
  video?: string;
  poster?: string;
  stepsTitle: string;
  steps: { title: string; line: string }[];
  listTitle?: string;
  list?: string[];
  facts?: { value: string; label: string }[];
};

const artwork = mediaAssets;

export const listServices = cache(async (): Promise<PublicService[]> => {
  const [rows, strings] = await Promise.all([
    db
      .select({
        slug: services.slug,
        title: services.name,
        line: services.summary,
        intro: services.introHtml,
        steps: services.steps,
        facts: services.facts,
        documents: services.documents,
        tone: services.tone,
        kind: artwork.kind,
        staticPath: artwork.staticPath,
        cloudinaryPublicId: artwork.cloudinaryPublicId,
        imageAlt: artwork.altText,
        reelId: services.reelId,
      })
      .from(services)
      .leftJoin(artwork, eq(services.artworkId, artwork.id))
      .where(eq(services.status, "published"))
      .orderBy(asc(services.sortOrder)),
    db
      .select({ key: uiStrings.key, value: uiStrings.value })
      .from(uiStrings)
      .where(like(uiStrings.key, "service.%")),
  ]);

  const reelIds = [...new Set(rows.map((row) => row.reelId).filter((id): id is string => Boolean(id)))];
  const reels = reelIds.length
    ? await db
        .select({ id: mediaAssets.id, path: mediaAssets.staticPath })
        .from(mediaAssets)
        .where(inArray(mediaAssets.id, reelIds))
    : [];
  const reelPath = new Map(reels.map((r) => [r.id, r.path]));
  const text = new Map(strings.map((s) => [s.key, s.value]));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    label: text.get(`service.${row.slug}.label`) ?? "",
    line: row.line ?? "",
    intro: row.intro ?? "",
    image: mediaUrl(row, 960),
    imageAlt: row.imageAlt ?? "",
    video: row.reelId ? (reelPath.get(row.reelId) ?? undefined) : undefined,
    poster: text.get(`service.${row.slug}.poster`),
    stepsTitle: text.get(`service.${row.slug}.stepsTitle`) ?? "",
    steps: (row.steps ?? []).map((s) => ({ title: s.title, line: s.body })),
    listTitle: text.get(`service.${row.slug}.listTitle`),
    list: row.documents?.map((d) => d.label),
    facts: row.facts?.map((f) => ({ value: f.value, label: f.label })),
  }));
});

export async function getService(slug: string) {
  return (await listServices()).find((service) => service.slug === slug);
}

export const listServiceFaqs = cache(async (slug: string): Promise<FaqItem[]> => {
  const rows = await db
    .select({ q: serviceFaqs.question, a: serviceFaqs.answerHtml })
    .from(serviceFaqs)
    .innerJoin(services, eq(serviceFaqs.serviceId, services.id))
    .where(eq(services.slug, slug))
    .orderBy(asc(serviceFaqs.sortOrder));
  return rows;
});

export const listAllFaqs = cache(async (): Promise<FaqItem[]> => {
  const rows = await db
    .select({ q: serviceFaqs.question, a: serviceFaqs.answerHtml, service: services.sortOrder, order: serviceFaqs.sortOrder })
    .from(serviceFaqs)
    .innerJoin(services, eq(serviceFaqs.serviceId, services.id))
    .orderBy(asc(services.sortOrder), asc(serviceFaqs.sortOrder));
  return rows.map(({ q, a }) => ({ q, a }));
});
