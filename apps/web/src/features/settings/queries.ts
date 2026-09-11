import { cache } from "react";
import { allSettings } from "@/db/settings";
import { allUiStrings } from "@/db/ui-strings";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type SocialLink = { label: string; href: string; icon: string };

export const getFooterColumns = cache(async (): Promise<FooterColumn[]> => {
  const byKey = await allUiStrings();
  const columns = new Map<string, FooterColumn>();

  // A column is proved by its first link. Taking every footer.* key instead built empty columns
  // headed "tagline" and "copyright", and a second "Offices".
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

export const getGoogleRating = cache(async () => {
  const byKey = await allSettings();
  return {
    score: String(byKey.get("google_rating") ?? ""),
    count: Number(byKey.get("google_review_count") ?? 0),
  };
});

export type GoogleRating = Awaited<ReturnType<typeof getGoogleRating>>;
