import { cache } from "react";
import { allSettings, allUiStrings } from "./shared";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type SocialLink = { label: string; href: string; icon: string };

export const getFooterColumns = cache(async (): Promise<FooterColumn[]> => {
  const byKey = await allUiStrings();
  const columns = new Map<string, FooterColumn>();

  for (const key of byKey.keys()) {
    // The map now holds every interface string, not just the footer's, so the prefix does the
    // filtering the query used to do.
    if (!key.startsWith("footer.")) continue;
    const [, slug] = key.split(".");
    if (!columns.has(slug)) {
      columns.set(slug, { title: byKey.get(`footer.${slug}.title`) ?? slug, links: [] });
    }
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
