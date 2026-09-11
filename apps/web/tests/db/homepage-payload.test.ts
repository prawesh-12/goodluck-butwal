import { test, expect } from "vitest";
import { listArticles, getArticle } from "@/features/posts/queries";
import { listDestinations } from "@/features/destinations/queries";
import { getAboutContent } from "@/features/pages/queries";

const hasDb = Boolean(process.env.DATABASE_URL);

// Every page that shows a news card used to pull the body of all 31 articles with it, 312 KB
// that nothing rendered. The body now belongs to the one query that needs it.
test.runIf(hasDb)("the article card list carries no article bodies", async () => {
  const articles = await listArticles();

  expect(articles.length).toBeGreaterThan(0);
  for (const article of articles) {
    expect(article).not.toHaveProperty("html");
  }
});

test.runIf(hasDb)("a single article still comes back with its body", async () => {
  const [first] = await listArticles();
  const full = await getArticle(first.slug);

  expect(full?.slug).toBe(first.slug);
  expect(full?.html.length).toBeGreaterThan(0);
});

test.runIf(hasDb)("asking for an article that is not published returns nothing", async () => {
  expect(await getArticle("no-such-article-slug")).toBeUndefined();
});

// These two read media by id now instead of the whole table, so the guard is that the ids they
// do ask for still come back resolved. A destination without its own page carries no card image.
test.runIf(hasDb)("destinations and the about page still resolve their images", async () => {
  const [destinations, about] = await Promise.all([listDestinations(), getAboutContent()]);

  expect(destinations.length).toBeGreaterThan(0);
  expect(destinations.every((d) => d.flag)).toBe(true);
  expect(destinations.filter((d) => d.hasPage).every((d) => d.card && d.hero)).toBe(true);
  expect(about.csr.length).toBeGreaterThan(0);
  expect(about.csr.every((partner) => partner.logo)).toBe(true);
});
