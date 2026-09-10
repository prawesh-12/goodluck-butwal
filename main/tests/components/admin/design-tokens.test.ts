import { test, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const UI = "src/components/ui/admin";
const files = readdirSync(UI).filter((name) => name.endsWith(".tsx"));

// --color-muted belongs to the public site, where it is the dark slate body colour. Stock shadcn
// expects muted to be a light surface, so bg-muted drew dark-on-dark: the News tab labels were
// invisible. bg-secondary is the light surface in this theme.
test("no admin component paints a surface with the public muted colour", () => {
  const wrong = files.filter((name) => /\bbg-muted\b/.test(readFileSync(join(UI, name), "utf8")));
  expect(wrong).toEqual([]);
});

// Stock shadcn keeps every cell on one line, which suits a dense data table. These tables carry
// article and course titles, and on a 390px phone one long title pushed Status and Edit outside
// the scroll box, so neither could be reached.
test("a table cell wraps rather than forcing the table wider than the phone", () => {
  const table = readFileSync(join(UI, "table.tsx"), "utf8");
  const start = table.indexOf("function TableCell");
  expect(start).toBeGreaterThan(-1);
  const next = table.indexOf("\nfunction ", start);
  const body = table.slice(start, next === -1 ? undefined : next);

  expect(body).toContain("data-slot=\"table-cell\"");
  expect(body).not.toContain("whitespace-nowrap");
});

// Every colour an admin component names has to exist in the theme, or the class silently does
// nothing and the element renders transparent.
test("every colour an admin component names is defined in the theme", () => {
  const css = readFileSync("src/styles/globals.css", "utf8");
  const defined = new Set([...css.matchAll(/--color-([a-z-]+):/g)].map((m) => m[1]));

  const used = new Set<string>();
  for (const name of files) {
    for (const [, token] of readFileSync(join(UI, name), "utf8").matchAll(
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|shadow|accent|caret|divide)-((?:[a-z]+-)*[a-z]+)(?:\/\d+)?\b/g,
    )) {
      if (defined.has(token)) used.add(token);
    }
  }

  // Sanity: the sweep found real tokens, so an empty result cannot pass by accident.
  expect(used.size).toBeGreaterThan(5);
  expect([...used].filter((token) => !defined.has(token))).toEqual([]);
});
