import { test, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

// The admin screens live in src/app/admin, but the components they use now sit in their own
// feature or in the shared admin kit. Walking the imports keeps the set complete without naming
// every directory here.
function adminFiles(): string[] {
  const seen = new Set(files("src/app/admin"));
  const queue = [...seen];
  for (let path = queue.shift(); path; path = queue.shift()) {
    for (const [, spec] of readFileSync(path, "utf8").matchAll(/["']@\/((?:features|components)\/[^"']+)["']/g)) {
      for (const ext of [".tsx", ".ts"]) {
        const candidate = join("src", spec + ext);
        if (existsSync(candidate) && !seen.has(candidate)) {
          seen.add(candidate);
          queue.push(candidate);
        }
      }
    }
  }
  return [...seen].filter((path) => /\.tsx$/.test(path));
}

const admin = adminFiles();

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
