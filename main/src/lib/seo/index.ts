import type { Metadata } from "next";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { allSettings } from "@db/settings";
import {
  courses,
  destinations,
  events,
  institutions,
  mediaAssets,
  pages,
  posts,
  services,
  testPrepCourses,
} from "@db/schema";
import { company } from "@/config/site";
import { mediaUrl } from "@/lib/utils/media-url";

export const TITLE_SUFFIX = ` – ${company.short}`;

export type SeoRow = {
  seoTitle: string | null;
  seoDescription: string | null;
  seoNoindex: boolean;
  canonicalUrl: string | null;
  ogImage: string | null;
};

export type SeoDefaults = { title: string; description: string; ogImage: string };

export type SeoInput = {
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  row?: SeoRow | null;
  publishedTime?: string;
  noindex?: boolean;
};

export function absoluteUrl(value: string) {
  if (/^https?:\/\//.test(value)) return value;
  return `${company.url}${value.startsWith("/") ? value : `/${value}`}`;
}

const trimmed = (value: string | null | undefined) => value?.trim() || "";

export function buildMetadataFrom(input: SeoInput, defaults: SeoDefaults): Metadata {
  const row = input.row;
  const title = trimmed(row?.seoTitle) || trimmed(input.title) || defaults.title;
  const description =
    trimmed(row?.seoDescription) || trimmed(input.description) || defaults.description;
  const image = trimmed(row?.ogImage) || trimmed(input.image) || defaults.ogImage;
  const canonical = absoluteUrl(trimmed(row?.canonicalUrl) || input.path);
  const noindex = input.noindex === true || row?.seoNoindex === true;
  const images = image ? [image] : [];

  const shared = { title, description, url: canonical, images };

  return {
    // A stored title that already carries the site name would otherwise get the layout template
    // applied to it a second time.
    title: title.endsWith(TITLE_SUFFIX) ? { absolute: title } : title,
    description: description || undefined,
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: input.publishedTime
      ? { ...shared, type: "article", publishedTime: input.publishedTime }
      : { ...shared, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

const getSeoDefaults = cache(async (): Promise<SeoDefaults> => {
  const byKey = await allSettings();
  const ogImageId = String(byKey.get("default_og_image_id") ?? "");

  let ogImage = "";
  if (ogImageId) {
    const [asset] = await db
      .select({
        kind: mediaAssets.kind,
        staticPath: mediaAssets.staticPath,
        cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, ogImageId));
    if (asset) ogImage = mediaUrl(asset, 1280);
  }

  return {
    title: String(byKey.get("default_seo_title") ?? company.name),
    description: String(byKey.get("default_seo_description") ?? ""),
    ogImage,
  };
});

const seoTables = {
  page: pages,
  post: posts,
  event: events,
  course: courses,
  institution: institutions,
  destination: destinations,
  service: services,
  testPrepCourse: testPrepCourses,
};

export type SeoKind = keyof typeof seoTables;

// The public query modules return the shape each page renders, not the editable SEO columns,
// so the override row is fetched here by slug.
const getSeoRow = cache(async (kind: SeoKind, slug: string): Promise<SeoRow | null> => {
  const table = seoTables[kind];
  const [row] = await db
    .select({
      seoTitle: table.seoTitle,
      seoDescription: table.seoDescription,
      seoNoindex: table.seoNoindex,
      canonicalUrl: table.canonicalUrl,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(table)
    .leftJoin(mediaAssets, eq(table.seoOgImageId, mediaAssets.id))
    .where(eq(table.slug, slug))
    .limit(1);

  if (!row) return null;
  return {
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoNoindex: row.seoNoindex,
    canonicalUrl: row.canonicalUrl,
    ogImage: row.kind ? mediaUrl(row, 1280) : null,
  };
});

export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  return buildMetadataFrom(input, await getSeoDefaults());
}

export async function buildEntityMetadata(
  kind: SeoKind,
  slug: string,
  input: Omit<SeoInput, "row">,
): Promise<Metadata> {
  const [defaults, row] = await Promise.all([getSeoDefaults(), getSeoRow(kind, slug)]);
  return buildMetadataFrom({ ...input, row }, defaults);
}
