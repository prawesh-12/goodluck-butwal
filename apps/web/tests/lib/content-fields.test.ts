import { test, expect } from "vitest";
import { missingAltProblems, publishRefusal, slugRedirect } from "@/lib/validators/content-fields";

test("an image nobody has described blocks publishing", () => {
  const problems = missingAltProblems([
    { label: "The hero image", id: "a", altText: null },
    { label: "The card image", id: "b", altText: "A campus lawn" },
    { label: "A decorative swirl", id: "c", altText: "" },
    { label: "The share image", id: null, altText: null },
  ]);
  expect(problems).toEqual(["The hero image has no alt text. Describe it in Images first."]);
});

test("renaming a published address writes a 301", () => {
  expect(slugRedirect("/courses/nursing", "/courses/nursing-degree", true)).toEqual({
    fromPath: "/courses/nursing",
    toPath: "/courses/nursing-degree",
    statusCode: 301,
    isActive: true,
    note: "Address changed from /courses/nursing to /courses/nursing-degree",
  });
});

test("a draft rename writes no redirect", () => {
  expect(slugRedirect("/courses/a", "/courses/b", false)).toBe(null);
});

test("saving without changing the address writes no redirect", () => {
  expect(slugRedirect("/courses/a", "/courses/a", true)).toBe(null);
});

test("a refusal names every problem instead of only the first", () => {
  const refusal = publishRefusal(["Title is empty.", "There is no banner image."]);
  expect(refusal.ok).toBe(false);
  expect(refusal.fieldErrors.publish).toEqual(["Title is empty.", "There is no banner image."]);
});
