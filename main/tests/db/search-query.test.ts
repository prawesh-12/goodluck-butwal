import { test, expect } from "vitest";
import { search } from "@/server/queries/search";
import { KINDS } from "@/components/search/query";

const hasDb = Boolean(process.env.DATABASE_URL);

test.runIf(hasDb)("groups come back in the order the page lists them", async () => {
  const groups = await search("a");
  const order = groups.map((g) => g.kind);
  expect(order).toEqual(KINDS.filter((kind) => order.includes(kind)));
});

test.runIf(hasDb)("no group holds more than a page of hits", async () => {
  for (const group of await search("a")) {
    expect(group.hits.length).toBeLessThanOrEqual(12);
    expect(group.count).toBe(group.hits.length);
  }
});

// UNION ALL gives no order of its own, and equal dates used to make the cut-off arbitrary.
test.runIf(hasDb)("the same search twice gives the same rows in the same order", async () => {
  expect(await search("a")).toEqual(await search("a"));
});

test.runIf(hasDb)("every hit carries a link, a title and a date", async () => {
  for (const group of await search("australia")) {
    for (const hit of group.hits) {
      expect(hit.href).toMatch(/^\/[a-z-]+\/[a-z0-9-]+$/);
      expect(hit.article.title).not.toBe("");
      expect(hit.article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test.runIf(hasDb)("a wildcard typed by hand is searched for, not treated as a wildcard", async () => {
  expect(await search("%")).toEqual([]);
});

test.runIf(hasDb)("an empty search asks the database nothing", async () => {
  expect(await search("")).toEqual([]);
});
