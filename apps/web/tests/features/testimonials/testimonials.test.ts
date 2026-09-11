import { test, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { reviews, successStories } from "@/features/testimonials/testimonials";

const DIR = "public/images/success-stories";

// The home page and /success-stories render this list straight from the repo, so a file left in
// the folder or a path with no file behind it is a story the site gets wrong.
test("the success story folder and the published list hold the same files", () => {
  const onDisk = readdirSync(DIR).sort();
  const listed = successStories.map((s) => s.image.split("/").pop()!).sort();

  expect(listed).toEqual(onDisk);
});

test("every reviewer avatar has a file behind it", () => {
  const missing = reviews.map((r) => r.avatar).filter((path) => !existsSync(`public${path}`));

  expect(missing).toEqual([]);
});
