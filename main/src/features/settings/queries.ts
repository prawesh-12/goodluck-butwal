import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { allSettings } from "@db/settings";
import { allUiStrings } from "@db/ui-strings";
import { mediaUrl } from "@/lib/utils/media-url";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type SocialLink = { label: string; href: string; icon: string };

export const getFooterColumns = cache(async (): Promise<FooterColumn[]> => {
  const byKey = await allUiStrings();
  const columns = new Map<string, FooterColumn>();

  // A column is a list of links, so its first link is what proves it is one. Taking every
  // footer.* key instead built empty columns headed "tagline" and "copyright", and a second
  // "Offices" beside the one the footer lays out itself from the offices table.
  for (const key of byKey.keys()) {
    const slug = /^footer\.([^.]+)\.0\.label$/.exec(key)?.[1];
    if (!slug) continue;
    columns.set(slug, { title: byKey.get(`footer.${slug}.title`) ?? slug, links: [] });
  }

  for (const [slug, column] of columns) {
    for (let i = 0; byKey.has(`footer.${slug}.${i}.label`); i += 1) {
      column.links.push({
        label: byKey.get(`footer.${slug}.${i}.label`)!,
        href: byKey.get(`footer.${slug}.${i}.href`) ?? "#",
      });
    }
  }
  return [...columns.values()];
});

// The footer hides a social link that has no real URL yet.
export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const links = ((await allSettings()).get("social_links") as SocialLink[] | undefined) ?? [];
  return links.filter((link) => link.href && link.href !== "#");
});

// Undefined rather than an empty string: the hero keeps its own default image, so nothing set
// here means the page looks the way it ships.
export const getHeroImage = cache(async (): Promise<string | undefined> => {
  const id = String((await allSettings()).get("hero_image_id") ?? "");
  if (!id) return undefined;

  const [asset] = await db
    .select({
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id));

  return (asset ? mediaUrl(asset, 1920) : "") || undefined;
});

// Every video in the library is a file in public/: uploads go to Cloudinary as images only, so
// there is no transformation to build here.
export const getHeroVideo = cache(async (): Promise<string | undefined> => {
  const id = String((await allSettings()).get("hero_video_id") ?? "");
  if (!id) return undefined;

  const [asset] = await db
    .select({ staticPath: mediaAssets.staticPath })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id));

  return asset?.staticPath || undefined;
});

export const getGoogleRating = cache(async () => {
  const byKey = await allSettings();
  return {
    score: String(byKey.get("google_rating") ?? ""),
    count: Number(byKey.get("google_review_count") ?? 0),
  };
});

export type GoogleRating = Awaited<ReturnType<typeof getGoogleRating>>;
