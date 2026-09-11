import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

test("a success-story image asks for its fixed card width, not a viewport share", () => {
  expect(read("src/features/testimonials/components/stories.tsx")).toMatch(/sizes="\(min-width: 1200px\) 290px, \(min-width: 810px\) 250px, 180px"/);
});
