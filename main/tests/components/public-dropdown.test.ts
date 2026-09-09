import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

// Everything the public site renders, minus the admin, which has its own guard.
const publicFiles = [...files("src/components"), ...files("src/features"), ...files("src/app")].filter(
  (path) => !path.includes("/admin"),
);

// A native dropdown is drawn by the operating system, so it ignores the site's styling and looks
// like a different product on every platform. A multiple select is a list box in the page and stays.
test("no public form opens a native dropdown", () => {
  const native = publicFiles.flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line, i) => ({ path, line, at: i + 1 }))
      .filter(({ line }) => /<select(?![A-Za-z])/.test(line) && !/multiple/.test(line))
      .map(({ path, at }) => `${path}:${at}`),
  );

  expect(native).toEqual([]);
});
