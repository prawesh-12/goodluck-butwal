import { cache } from "react";
import { inArray } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, pages } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";

// Same field names the About routes already render, so a page only swaps its import.
export type AboutContent = {
  established: string;
  mission: string;
  vision: string;
  values: string;
  ethics: string[];
  founderQuote: string;
  founders: string;
  coFounderMessage: string[];
  coFounderSummary: string[];
  csrIntro: string;
  csr: { name: string; line: string; logo: string; photo?: string }[];
  careersValues: { title: string; line: string }[];
  staffVoices: { quote: string; name: string; role: string }[];
};

type AboutBlocks = {
  established: string;
  mission: string;
  vision: string;
  values: { title: string; body: string }[];
  ethics: string[];
  quote: { text: string; author: string };
};
type FoundersBlocks = { message_html: string; summary: string };
type CsrBlocks = { partners: { name: string; logo_id: string | null; photo_id: string | null; line: string }[] };
type CareersBlocks = {
  values: { title: string; body: string }[];
  voices: { quote: string; name: string; role: string }[];
};

const SLUGS = ["about", "message-from-co-founders", "corporate-social-responsibility", "careers"];

export const getAboutContent = cache(async (): Promise<AboutContent> => {
  const rows = await db
    .select({ slug: pages.slug, intro: pages.intro, blocks: pages.blocks })
    .from(pages)
    .where(inArray(pages.slug, SLUGS));

  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  // Only the CSR partners carry images, so the media read is limited to the ids they name.
  const csrBlocks = bySlug.get("corporate-social-responsibility")?.blocks as CsrBlocks | undefined;
  const wanted = [...new Set(
    (csrBlocks?.partners ?? []).flatMap((p) => [p.logo_id, p.photo_id]).filter((id): id is string => Boolean(id)),
  )];
  const media = wanted.length
    ? await db
        .select({
          id: mediaAssets.id,
          kind: mediaAssets.kind,
          staticPath: mediaAssets.staticPath,
          cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        })
        .from(mediaAssets)
        .where(inArray(mediaAssets.id, wanted))
    : [];
  const path = new Map(media.map((m) => [m.id, mediaUrl(m, 640)]));

  const about = bySlug.get("about")?.blocks as AboutBlocks;
  const founders = bySlug.get("message-from-co-founders")?.blocks as FoundersBlocks;
  const csr = bySlug.get("corporate-social-responsibility")?.blocks as CsrBlocks;
  const careers = bySlug.get("careers")?.blocks as CareersBlocks;

  return {
    established: about.established,
    mission: about.mission,
    vision: about.vision,
    values: about.values[0]?.body ?? "",
    ethics: about.ethics,
    founderQuote: about.quote.text,
    founders: about.quote.author,
    // The paragraphs are stored as one html string and split back for the page that lists them.
    coFounderMessage: founders.message_html
      .split("</p>")
      .map((p) => p.replace(/<p>/, "").trim())
      .filter(Boolean),
    coFounderSummary: [founders.summary],
    csrIntro: bySlug.get("corporate-social-responsibility")?.intro ?? "",
    csr: csr.partners.map((p) => ({
      name: p.name,
      line: p.line,
      logo: p.logo_id ? (path.get(p.logo_id) ?? "") : "",
      photo: p.photo_id ? (path.get(p.photo_id) ?? undefined) : undefined,
    })),
    careersValues: careers.values.map((v) => ({ title: v.title, line: v.body })),
    staffVoices: careers.voices,
  };
});
