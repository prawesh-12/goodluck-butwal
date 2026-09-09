import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { uiStringRows } from "../../db/seed/site-text";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const source = sourceFiles("src").map((path) => readFileSync(path, "utf8")).join("\n");
const used = new Set([...source.matchAll(/\bt\("([a-z0-9_.]+)"/g)].map((m) => m[1]));
// A key built from a loop counter, such as `home.offices.pathway.${i}`, is used by its prefix.
const prefixes = [...source.matchAll(/\bt\(`([a-z0-9_.]+)\$\{/g)].map((m) => m[1]);
const seeded = new Set(uiStringRows().map((row) => row.key));

const isUsed = (key: string) => used.has(key) || prefixes.some((prefix) => key.startsWith(prefix));

test("every key a page asks for has a row an admin can edit", () => {
  expect([...used].filter((key) => !seeded.has(key)).sort()).toEqual([]);
});

// A row nobody reads shows up in the admin as wording that changes nothing.
test("every seeded key is read by a page", () => {
  // Footer rows are built from the link list, so they are read by position rather than by name.
  const footer = (key: string) => key.startsWith("footer.") && key !== "footer.tagline" && key !== "footer.copyright";
  expect([...seeded].filter((key) => !footer(key) && !isUsed(key)).sort()).toEqual([]);
});

test("every row carries a label and a help line for the admin", () => {
  expect(uiStringRows().filter((row) => !row.label.trim() || !row.help.trim())).toEqual([]);
});

// The audit that moved every sentence into ui_strings was a grep, and a grep missed the lines
// where the text sits on its own between the tags. This is that grep, kept.
const publicFiles = sourceFiles("src").filter(
  (path) => !path.includes("/admin/") && /^src\/(app|components)\//.test(path),
);

// Wording that stays in the code, each for a reason.
const ALLOWED = [
  // The 500 screens run after a render has already failed, often because the database did.
  "src/app/(site)/error.tsx",
  "src/app/global-error.tsx",
];

// The honeypot label is inside an aria-hidden block. Only a bot ever reads it.
const HONEYPOT = "Company website";

test("no sentence is left sitting in a public component", () => {
  const stray = publicFiles
    .filter((path) => !ALLOWED.includes(path))
    .flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .map((line, i) => ({ path, line: line.trim(), at: i + 1 }))
        .filter(({ line }) => /^[A-Z][a-z][A-Za-z ,.?!&'-]{4,}$/.test(line) && line !== HONEYPOT)
        .map(({ path, line, at }) => `${path}:${at} ${line}`),
    );

  expect(stray).toEqual([]);
});
