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
  expect(hero).toMatch(/<source\s+media="\(min-width: 1200px\)"\s+srcSet=\{assetSrcSet\(gl\.heroMeadow\)\}/);
  expect(hero).not.toMatch(/<Img[^>]+src=\{gl\.heroMeadow\}/);
});

// Whichever image is the largest paint on a viewport has to be discoverable early.
test("both hero paint candidates carry a priority hint", () => {
  const eager = hero.match(/fetchPriority="high"/g) ?? [];
  expect(eager.length).toBe(2);
});

// Phones get a lighter sky encoding. React skips the automatic preload for an img inside <picture>,
// so each source needs its own preload, scoped by media query so a phone never fetches both.
test("the hero sky has a phone source and a preload per breakpoint", () => {
  expect(hero).toMatch(/<source\s+media=\{PHONE\}\s+type="image\/avif"\s+srcSet=\{phoneSky\}\s+sizes="100vw"\s*\/>/);
  expect(hero).toContain('const PHONE = "(max-width: 809px)";');
  const preloads = hero.match(/preload\([^\n]*media: (PHONE|"\(min-width: 810px\)")[^\n]*fetchPriority: "high"/g) ?? [];
  expect(preloads.length).toBe(2);
});

// A browser without AVIF must fall through to the WebP the site served before, and fetch it once:
// the AVIF source and its preload are both typed, and the fallback source has no preload of its own.
test("the phone sky falls back to the untyped good-quality source without a second preload", () => {
  expect(hero).toMatch(/type="image\/avif"\s+srcSet=\{phoneSky\}[^\n]*\/>\s*<source\s+media=\{PHONE\}\s+srcSet=\{assetSrcSet\(sky, WIDE_IMAGE_WIDTHS, "good"\)\}\s+sizes="100vw"\s*\/>\s*<Img\s+src=\{sky\}/);
  expect(hero).toMatch(/preload\([^\n]*type: "image\/avif"[^\n]*media: PHONE/);
  expect((hero.match(/preload\(/g) ?? []).length).toBe(2);
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
