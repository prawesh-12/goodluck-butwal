import { test, expect } from "vitest";
import { count } from "drizzle-orm";
import {
  destinations,
  pages,
  partners,
  postCategories,
  posts,
  serviceFaqs,
  services,
  teamMembers,
  testimonials,
} from "@db/schema";

// Needs a seeded database. CI has none, so it stands aside there rather than failing.
const hasDb = Boolean(process.env.DATABASE_URL);

const EXPECTED = [
  ["team_members", teamMembers, 22],
  ["partners", partners, 43],
  ["services", services, 4],
  ["destinations", destinations, 3],
  ["post_categories", postCategories, 7],
  ["posts", posts, 31],
  ["testimonials", testimonials, 18],
  ["pages", pages, 5],
  ["service_faqs", serviceFaqs, 5],
] as const;

test.runIf(hasDb).each(EXPECTED)("%s holds %s rows after the migration", async (_name, table, expected) => {
  const { db } = await import("@db/client");
  const [row] = await db.select({ n: count() }).from(table);
  expect(row.n).toBe(expected);
});

test.runIf(hasDb)("every article slug is still one of the original 31", async () => {
  const { db } = await import("@db/client");
  const rows = await db.select({ slug: posts.slug }).from(posts);
  const articles: { slug: string }[] = (await import("../../db/seed/source/articles.json")).default;
  const original = new Set(articles.map((a) => a.slug));

  expect(rows).toHaveLength(31);
  for (const row of rows) {
    expect(original.has(row.slug), `${row.slug} is not an original slug`).toBe(true);
  }
});
