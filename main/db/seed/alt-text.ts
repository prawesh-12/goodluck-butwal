import { and, eq, inArray, isNull, sql } from "drizzle-orm";
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

  const described: { id: string; value: string }[] = [];
  const decorative: string[] = [];

  for (const row of rows) {
    if (!row.path) continue;

    let value: string | null = source[row.path] ?? null;
    if (!value && row.path.startsWith("/images/flags/")) value = flagAlt(row.path);

    if (value) described.push({ id: row.id, value });
    else if (DECORATIVE.some((rule) => rule.test(row.path!))) decorative.push(row.id);
  }

  // Every row gets a different string, so this is one statement with the pairs inlined rather than
  // an update each. Over the HTTP driver that is one round trip instead of a couple of hundred.
  if (described.length) {
    const pairs = sql.join(described.map((r) => sql`(${r.id}::uuid, ${r.value})`), sql`, `);
    await db.execute(
      sql`update ${mediaAssets} set alt_text = v.value from (values ${pairs}) as v(id, value) where ${mediaAssets.id} = v.id`,
    );
  }
  if (decorative.length) {
    await db.update(mediaAssets).set({ altText: "" }).where(inArray(mediaAssets.id, decorative));
  }

  const [left] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.type, "image"), isNull(mediaAssets.altText)));

  console.log(`    described ${described.length}, marked ${decorative.length} decorative, ${left.n} still undescribed`);
  return described.length + decorative.length;
}
