import { test, expect } from "vitest";
import { readdirSync } from "node:fs";
import { successStories } from "../../db/seed/source/stories";

const DIR = "public/images/success-stories";

// The seed publishes exactly what this list names and deletes any graphic missing from it, so a
// file left in the folder or a path with no file behind it is a story the site gets wrong.
test("the success story folder and the seed list hold the same files", () => {
  const onDisk = readdirSync(DIR).sort();
  const listed = successStories.map((s) => s.image.split("/").pop()!).sort();

  expect(listed).toEqual(onDisk);
});
