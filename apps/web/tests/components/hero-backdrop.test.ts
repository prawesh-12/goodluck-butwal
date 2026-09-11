import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

// A fetchPriority="high" img rendered by a server component becomes a Flight preload hint,
// and every route the home page prefetched then downloaded its hero sky.
test("the inner hero backdrop is rendered from a client component", () => {
  const backdrop = read("src/components/shared/hero-backdrop.tsx");
  expect(backdrop.startsWith('"use client";')).toBe(true);
  expect(backdrop).toMatch(/<Img[^>]+fetchPriority="high"/);
  expect(read("src/components/shared/inner.tsx")).not.toMatch(/fetchPriority/);
});
