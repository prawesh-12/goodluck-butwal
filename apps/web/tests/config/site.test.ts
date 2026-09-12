import { test, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { nav } from "@/config/site";

const SITE = "src/app/(site)";

// Walks the route folders, letting a [param] folder stand in for any segment.
function hasPage(href: string) {
  let dir = SITE;
  for (const segment of href.split("/").filter(Boolean)) {
    const fixed = `${dir}/${segment}`;
    if (existsSync(fixed)) {
      dir = fixed;
      continue;
    }
    const dynamic = readdirSync(dir).find((name) => name.startsWith("["));
    if (!dynamic) return false;
    dir = `${dir}/${dynamic}`;
  }
  return existsSync(`${dir}/page.tsx`);
}

test("every nav link and dropdown child has a page behind it", () => {
  const hrefs = nav.flatMap((item) => ("children" in item ? item.children.map((c) => c.href) : [item.href]));
  const missing = hrefs.filter((href) => !hasPage(href));
  expect(missing).toEqual([]);
});
