import { test, expect, describe } from "vitest";
import { readFileSync } from "node:fs";

// Pulls the literal out of revalidatePath("/x") and revalidatePath(`/x/${slug}`), turning an
// interpolated segment into :slug so a template and a plain string compare the same way.
function revalidatedPaths(feature: string): string[] {
  const source = readFileSync(`src/features/${feature}/actions.ts`, "utf8");
  const found = source.matchAll(/revalidatePath\(\s*(["'`])([^"'`]*)\1/g);
  return [...found].map((m) => m[2].replace(/\$\{[^}]*\}/g, ":slug"));
}

// The public pages are statically generated, so a saved change only reaches a visitor if the
// action revalidated that route. A route rendering the content but missing here goes stale.
const EXPECTED: Record<string, string[]> = {
  team: ["/admin/team", "/about/team", "/about", "/", "/team/:slug"],
  partners: ["/admin/partners", "/", "/about", "/contact/book-consultation"],
  posts: ["/admin/posts", "/news", "/", "/news/:slug", "/news/category/[slug]", "/news/tag/[slug]"],
  events: ["/admin/events", "/events", "/", "/events/:slug"],
  institutions: [
    "/admin/institutions",
    "/institutions",
    "/courses",
    "/destinations/[destination]",
    "/courses/[slug]",
  ],
  courses: ["/admin/courses", "/courses"],
  "test-prep": ["/admin/test-prep", "/test-preparation", "/test-preparation/batches"],
};

describe.each(Object.entries(EXPECTED))("%s", (feature, routes) => {
  const paths = revalidatedPaths(feature);

  test.each(routes)("revalidates %s", (route) => {
    expect(paths).toContain(route);
  });
});

test("the paths are read from the source, not assumed", () => {
  expect(revalidatedPaths("posts").length).toBeGreaterThan(3);
  expect(revalidatedPaths("posts")).not.toContain("/nothing-renders-this");
});

test("linking partners to institutions drops the partners cache", () => {
  const source = readFileSync("src/features/institutions/actions.ts", "utf8");
  const link = source.slice(source.indexOf("export async function linkPartnersToInstitutions"));
  expect(link).toContain("invalidate(TAGS.partners)");
});

describe("sitemap", () => {
  test.each(["team", "posts", "events", "institutions", "courses", "test-prep"])(
    "%s revalidates the sitemap",
    (feature) => {
      expect(readFileSync(`src/features/${feature}/actions.ts`, "utf8")).toContain("revalidateSitemap()");
    },
  );

  test.each(Object.keys(EXPECTED))("%s does not flush the whole route cache", (feature) => {
    expect(readFileSync(`src/features/${feature}/actions.ts`, "utf8")).not.toContain('revalidatePath("/", "layout")');
  });
});
