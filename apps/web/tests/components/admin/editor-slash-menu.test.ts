import { test, expect } from "vitest";
import { matchSlash, slashItems } from "@/components/shared/admin/editor-slash-menu";

const items = slashItems(() => undefined);

test("an empty query lists every block", () => {
  expect(matchSlash(items, "")).toHaveLength(items.length);
});

test("a query matches the title or a keyword, whatever the case", () => {
  expect(matchSlash(items, "H2").map((i) => i.title)).toEqual(["Heading"]);
  expect(matchSlash(items, "list").map((i) => i.title)).toEqual(["Bullets", "Numbered list"]);
  expect(matchSlash(items, "photo").map((i) => i.title)).toEqual(["Picture"]);
});

test("a query nothing matches gives an empty list", () => {
  expect(matchSlash(items, "zzz")).toEqual([]);
});
