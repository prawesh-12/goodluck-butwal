import type { Metadata } from "next";
import { cache } from "react";
import { allSettings } from "@db/settings";
import { company } from "@/config/site";

export const TITLE_SUFFIX = ` – ${company.short}`;

export type SeoDefaults = { title: string; description: string };

export type SeoInput = {
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  publishedTime?: string;
  noindex?: boolean;
};

export function absoluteUrl(value: string) {
  if (/^https?:\/\//.test(value)) return value;
  return `${company.url}${value.startsWith("/") ? value : `/${value}`}`;
}

const trimmed = (value: string | null | undefined) => value?.trim() || "";

export function buildMetadataFrom(input: SeoInput, defaults: SeoDefaults): Metadata {
  const title = trimmed(input.title) || defaults.title;
  const description = trimmed(input.description) || defaults.description;
  const image = trimmed(input.image);
  const canonical = absoluteUrl(input.path);
  const images = image ? [image] : [];

  const shared = { title, description, url: canonical, images };

  return {
    // Otherwise the layout template appends the site name a second time.
    title: title.endsWith(TITLE_SUFFIX) ? { absolute: title } : title,
    description: description || undefined,
    alternates: { canonical },
    ...(input.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: input.publishedTime
      ? { ...shared, type: "article", publishedTime: input.publishedTime }
      : { ...shared, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

const getSeoDefaults = cache(async (): Promise<SeoDefaults> => {
  const byKey = await allSettings();
  return {
    title: String(byKey.get("default_seo_title") ?? company.name),
    description: String(byKey.get("default_seo_description") ?? ""),
  };
});

export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  return buildMetadataFrom(input, await getSeoDefaults());
}
