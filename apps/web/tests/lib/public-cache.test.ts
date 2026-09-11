import { test, expect, describe } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { TAGS } from "@/lib/cache";

const read = (p: string) => readFileSync(p, "utf8");

// A visitor only avoids a Neon query while both halves stay in step: the query is cached under
// a tag, and every mutation that changes those rows purges that same tag.
const AREAS: { feature: string; tag: string; queries: string[] }[] = [
  { feature: "team", tag: TAGS.team, queries: ["listTeam"] },
  { feature: "partners", tag: TAGS.partners, queries: ["listPartnerLogos"] },
  { feature: "posts", tag: TAGS.posts, queries: ["listArticles", "listCategories"] },
  { feature: "institutions", tag: TAGS.institutions, queries: ["listInstitutions", "listInstitutionImages"] },
  { feature: "courses", tag: TAGS.courses, queries: ["getCourse", "listCourseFilterOptions"] },
  { feature: "test-prep", tag: TAGS.testPrep, queries: ["listTestPrepCourses"] },
];

describe.each(AREAS)("$feature", ({ feature, tag, queries }) => {
  const source = read(`src/features/${feature}/queries.ts`);
  const actions = read(`src/features/${feature}/actions.ts`);

  test.each(queries)("%s is cached under a tag", (fn) => {
    expect(source).toContain(`const ${fn}Uncached = cached(`);
  });

  test("the cached queries carry this area's tag", () => {
    expect(source).toContain(`TAGS.${Object.keys(TAGS).find((k) => TAGS[k as keyof typeof TAGS] === tag)}`);
  });

  test("mutations purge that tag, so an edit appears without a deploy", () => {
    expect(actions).toMatch(/invalidate\(TAGS\./);
  });
});

// The layout runs on every request, cached route or not.
describe("layout globals", () => {
  test.each([
    ["src/db/ui-strings.ts", "uiStrings"],
    ["src/db/settings.ts", "settings"],
    ["src/features/offices/queries.ts", "offices"],
  ])("%s is cached", (path, tagKey) => {
    const source = read(path);
    expect(source).toContain("cached(");
    expect(source).toContain(`TAGS.${tagKey}`);
  });

  // These three are developer-controlled: no admin edits them, so nothing purges their tag and
  // the hourly backstop in cached() is what picks a deployed change up.
  test.each(["site-text", "settings", "offices"])("%s has no admin mutation", (feature) => {
    expect(existsSync(`src/features/${feature}/actions.ts`)).toBe(false);
  });

  test("a cached read always carries a backstop, so a developer change lands without a purge", () => {
    expect(read("src/lib/cache.ts")).toContain("revalidate: HOUR");
  });
});

// Seat counts decide whether a form is open. Serving a cached copy would let someone register
// for a batch that filled up.
describe("live data stays uncached", () => {
  test.each([
    ["src/features/events/queries.ts", "seatsTaken"],
    ["src/features/test-prep/queries.ts", "batchForRegistration"],
  ])("%s: %s is not wrapped in the data cache", (path, fn) => {
    expect(read(path)).not.toContain(`const ${fn}Uncached = cached(`);
  });

  // Free text makes the key space unbounded, so caching it would fill the cache with one-offs.
  test("site search is not cached", () => {
    expect(read("src/features/search/queries.ts")).not.toContain("cached(");
  });
});

test("one tag per body of content, no shared or duplicated values", () => {
  const values = Object.values(TAGS);
  expect(new Set(values).size).toBe(values.length);
});
