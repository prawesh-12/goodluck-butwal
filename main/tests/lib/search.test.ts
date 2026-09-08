import { test, expect } from "vitest";
import { groupHits, MAX_QUERY, searchTerm, type SearchHit } from "@/components/search/query";

const hit = (kind: SearchHit["kind"], slug: string): SearchHit => ({
  kind,
  href: `/${kind}/${slug}`,
  article: { slug, title: slug, date: "2026-01-01", category: "", image: "", excerpt: "" },
});

test("a percent sign is escaped so it does not act as a wildcard", () => {
  expect(searchTerm("100%")?.pattern).toBe("%100\\%%");
});

test("an underscore is escaped so it matches a real underscore", () => {
  expect(searchTerm("year_one")?.pattern).toBe("%year\\_one%");
});

test("a backslash is escaped before the wildcards it would otherwise escape", () => {
  expect(searchTerm("a\\b")?.pattern).toBe("%a\\\\b%");
});

test("an ordinary word becomes a contains pattern", () => {
  expect(searchTerm(" nursing ")?.pattern).toBe("%nursing%");
});

test("an empty or whitespace query has nothing to search for", () => {
  expect(searchTerm("")).toBe(null);
  expect(searchTerm("   ")).toBe(null);
  expect(searchTerm(undefined)).toBe(null);
});

test("a very long query is capped", () => {
  const term = searchTerm("a".repeat(500));
  expect(term?.q.length).toBe(MAX_QUERY);
});

test("results group by kind with a count per group", () => {
  const groups = groupHits([
    hit("courses", "nursing"),
    hit("posts", "visa-news"),
    hit("courses", "midwifery"),
  ]);
  expect(groups.map((g) => [g.kind, g.count])).toEqual([
    ["courses", 2],
    ["posts", 1],
  ]);
});

test("a group with no results is dropped rather than shown empty", () => {
  const groups = groupHits([hit("events", "open-day")]);
  expect(groups).toHaveLength(1);
  expect(groups[0].kind).toBe("events");
});

test("no results at all means no groups", () => {
  expect(groupHits([])).toEqual([]);
});
