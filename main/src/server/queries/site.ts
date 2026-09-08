import { cache } from "react";
import { allSettings, allUiStrings } from "./shared";

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
