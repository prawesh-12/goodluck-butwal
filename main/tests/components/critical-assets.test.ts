import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

const hero = readFileSync("src/components/shared/hero.tsx", "utf8");

// The meadow only shows from lg up. As a plain <img> the preload scanner fetched it on every
// viewport, which cost a phone 258 KB for a picture it never renders.
test("the hero meadow is requested through a media source, not a bare img", () => {
  expect(hero).toMatch(/<source\s+media="\(min-width: 1200px\)"\s+srcSet=\{gl\.heroMeadow\}/);
  expect(hero).not.toMatch(/<img[^>]+src=\{gl\.heroMeadow\}/);
});

// Whichever image is the largest paint on a viewport has to be discoverable early.
test("both hero paint candidates carry a priority hint", () => {
  const eager = hero.match(/fetchPriority="high"/g) ?? [];
  expect(eager.length).toBe(2);
});

const WEIGHT_CLASS = /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g;
const SHIPPED = new Set(["font-medium", "font-semibold"]);

// Only the 500 and 600 faces are bundled. Asking for any other weight makes the browser
// synthesise it from one of those, which looks wrong and ships nothing to catch it.
test("no public component asks for a font weight the site does not ship", () => {
  const asked = new Set<string>();
  for (const path of [...files("src/components"), ...files("src/features"), ...files("src/app")]) {
    if (path.includes("/admin/") || path.includes("admin")) continue;
    for (const m of readFileSync(path, "utf8").matchAll(WEIGHT_CLASS)) asked.add(m[0]);
  }
  expect([...asked].filter((c) => !SHIPPED.has(c)).sort()).toEqual([]);
});
