import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { matchTyped, nextEnabled, type DropdownOption } from "@/components/admin/dropdown";

const options: DropdownOption[] = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review", disabled: true },
  { value: "published", label: "Published" },
];

test("moving down skips a disabled option", () => {
  expect(nextEnabled(options, 0, 1)).toBe(2);
});

test("moving down stops on the last option instead of wrapping", () => {
  expect(nextEnabled(options, 2, 1)).toBe(2);
});

test("moving up stops on the first option instead of wrapping", () => {
  expect(nextEnabled(options, 0, -1)).toBe(0);
});

test("typing matches an option by its first letters, whatever the case", () => {
  expect(matchTyped(options, "pub")).toBe(2);
});

test("typing never lands on a disabled option", () => {
  expect(matchTyped(options, "in r")).toBe(-1);
});

test("typing something no option starts with matches nothing", () => {
  expect(matchTyped(options, "z")).toBe(-1);
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

// A native dropdown draws its open list with the operating system, which no stylesheet reaches.
// A multiple select is a list box rendered in the page, so it stays.
test("no admin form opens a native dropdown", () => {
  const native = [...files("src/app/admin"), ...files("src/components/admin")].flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line, i) => ({ path, line, at: i + 1 }))
      .filter(({ line }) => /<select(?![A-Za-z])/.test(line) && !/multiple/.test(line))
      .map(({ path, at }) => `${path}:${at}`),
  );

  expect(native).toEqual([]);
});
