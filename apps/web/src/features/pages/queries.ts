import { cache } from "react";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@goodluck/db";
import { pages } from "@goodluck/db/schema";
import { csrArt } from "@/config/assets";

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
type CsrBlocks = { partners: { name: string; line: string }[] };
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
    csr: csr.partners.map((p) => ({ name: p.name, line: p.line, logo: csrArt[p.name]?.logo ?? "", photo: csrArt[p.name]?.photo })),
    careersValues: careers.values.map((v) => ({ title: v.title, line: v.body })),
    staffVoices: careers.voices,
  };
});

// Registered particulars are not in the repo, so they live on the page row like the other about
// content. The seeded values are placeholders until the client sends the real ones.
export type ProfileBlocks = {
  type: string;
  registration_authority: string;
  registration_no: string;
  vat_no: string;
  bank: string;
  associations: string;
};

export const getCompanyProfile = cache(async () => {
  const [row] = await db
    .select({ intro: pages.intro, blocks: pages.blocks })
    .from(pages)
    .where(and(eq(pages.slug, "company-profile"), eq(pages.status, "published")));
  return row ? { intro: row.intro, ...(row.blocks as ProfileBlocks) } : undefined;
});
