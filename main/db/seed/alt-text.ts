import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { team } from "./source/team";
import { reviews, successStories } from "./source/stories";
import articles from "./source/articles.json";
import { destinations } from "./source/destinations";
import { services } from "./source/services";
import { about } from "./source/about";

// Alt text is never invented here. Every line below already describes its image somewhere in the
// source, and this only moves it onto the row.
function fromSource(): Record<string, string> {
  const alt: Record<string, string> = {};

  for (const person of team) alt[person.photo] = person.name;
  for (const review of reviews) alt[review.avatar] = review.name;
  for (const story of successStories) alt[story.image] = story.alt;
  for (const article of articles) alt[article.image] = article.title;
  for (const service of services) alt[service.image] = service.imageAlt;
  for (const d of destinations) {
    alt[d.hero] = d.heroAlt;
    alt[d.card] = `Studying in ${d.name}`;
  }
  // A reel's still frame shows the same thing the reel does.
  for (const service of services) {
    if (service.poster) alt[service.poster] = service.title;
  }
  for (const partner of about.csr) {
    if (partner.logo) alt[partner.logo] = `${partner.name} logo`;
    if (partner.photo) alt[partner.photo] = partner.name;
  }
  return alt;
}

// A flag is named by its file. "australia.svg" is the Australian flag and nothing else.
function flagAlt(path: string) {
  const name = path.split("/").pop()!.replace(/\.\w+$/, "").replace(/-/g, " ");
  return `${name.replace(/\b\w/g, (c) => c.toUpperCase())} flag`;
}

// Backgrounds, clouds, chrome and the partner carousel carry no information a screen reader
// needs. An empty alt is the correct answer for those, and it is different from "not yet
// described", which stays null.
const DECORATIVE = [
  /^\/images\/backgrounds\//,
  /^\/images\/clouds?/,
  /^\/images\/ui\//,
  /^\/images\/social\//,
  /^\/images\/partners\//,
  /^\/brand\//,
  /^\/images\/hero\//,
  /^\/images\/illustrations\//,
  /^\/favicon\./,
];

export async function seedAltText() {
  const source = fromSource();
  const rows = await db
    .select({ id: mediaAssets.id, path: mediaAssets.staticPath })
    .from(mediaAssets)
    .where(eq(mediaAssets.type, "image"));

  let described = 0;
  let decorative = 0;

  for (const row of rows) {
    if (!row.path) continue;

    let value: string | null = source[row.path] ?? null;
    if (!value && row.path.startsWith("/images/flags/")) value = flagAlt(row.path);

    if (value) {
      await db.update(mediaAssets).set({ altText: value }).where(eq(mediaAssets.id, row.id));
      described += 1;
    } else if (DECORATIVE.some((rule) => rule.test(row.path!))) {
      await db.update(mediaAssets).set({ altText: "" }).where(eq(mediaAssets.id, row.id));
      decorative += 1;
    }
  }

  const [left] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.type, "image"), isNull(mediaAssets.altText)));

  console.log(`    described ${described}, marked ${decorative} decorative, ${left.n} still undescribed`);
  return described + decorative;
}
