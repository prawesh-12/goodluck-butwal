import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets } from "@goodluck/db/schema";
import { team } from "./source/team";
import articles from "./source/articles.json";

// Alt text is never invented here. Every line below already describes its image somewhere in the
// source, and this only moves it onto the row.
function fromSource(): Record<string, string> {
  const alt: Record<string, string> = {};
  for (const person of team) alt[person.photo] = person.name;
  for (const article of articles) alt[article.image] = article.title;
  return alt;
}

// The partner carousel carries no information a screen reader needs. An empty alt is the correct
// answer there, and it is different from "not yet described", which stays null.
const DECORATIVE = [/^\/images\/partners\//];

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
    const value = source[row.path];
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
