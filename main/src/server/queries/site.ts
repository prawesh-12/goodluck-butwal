import { cache } from "react";
import { eq, like } from "drizzle-orm";
import { db } from "@db/client";
import { settings, uiStrings } from "@db/schema";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type SocialLink = { label: string; href: string; icon: string };

export const getFooterColumns = cache(async (): Promise<FooterColumn[]> => {
  const rows = await db
    .select({ key: uiStrings.key, value: uiStrings.value })
    .from(uiStrings)
    .where(like(uiStrings.key, "footer.%"));

  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const columns = new Map<string, FooterColumn>();

  for (const key of byKey.keys()) {
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
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "social_links"));

  const links = (row?.value as SocialLink[] | undefined) ?? [];
  return links.filter((link) => link.href && link.href !== "#");
});
