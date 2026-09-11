import { test, expect } from "vitest";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

test("lowercases and joins words with hyphens", () => {
  expect(slugify("Skilled Independent Visa")).toBe("skilled-independent-visa");
});

test("strips accents rather than dropping the letter", () => {
  expect(slugify("Café Málaga")).toBe("cafe-malaga");
});

test("drops punctuation and collapses the gaps", () => {
  expect(slugify("PTE score requirements: Australia, 2025!")).toBe(
    "pte-score-requirements-australia-2025",
  );
});

test("leaves no hyphen at either end", () => {
  expect(slugify("  --Melbourne--  ")).toBe("melbourne");
});

test("keeps a slug that nothing else is using", () => {
  expect(uniqueSlug("Melbourne", ["sydney", "perth"])).toBe("melbourne");
});

test("appends a number when the slug is taken", () => {
  expect(uniqueSlug("Melbourne", ["melbourne"])).toBe("melbourne-2");
});

test("keeps counting past the first collision", () => {
  expect(uniqueSlug("Melbourne", ["melbourne", "melbourne-2", "melbourne-3"])).toBe("melbourne-4");
});
