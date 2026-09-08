import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

const admin = [...files("src/app/admin"), ...files("src/components/admin")];

// btn-black, btn-black-sm and btn-blue carry a background and a shadow and nothing else. The
// public site pairs them with Tailwind padding, radius and white text. Used bare, as the admin
// did, a button has no padding and black text on a black gradient.
test("no admin button wears a public class on its own", () => {
  const bare = admin.flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line, i) => ({ path, line, at: i + 1 }))
      .filter(({ line }) => /className="btn-(black|black-sm|blue)"/.test(line))
      .map(({ path, at }) => `${path}:${at}`),
  );

  expect(bare).toEqual([]);
});

test("every admin button carries the admin class", () => {
  const wrong = admin.flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line, i) => ({ path, line, at: i + 1 }))
      .filter(({ line }) => /admin-btn-(primary|danger)/.test(line) && !/"admin-btn admin-btn-/.test(line))
      .map(({ path, at }) => `${path}:${at}`),
  );

  expect(wrong).toEqual([]);
});
