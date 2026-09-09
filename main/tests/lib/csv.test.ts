import { test, expect } from "vitest";
import { toCsv } from "@/lib/utils/csv";

test("starts with a byte order mark so Excel reads UTF-8", () => {
  const csv = toCsv([{ name: "Zoë Müller" }]);
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain("Zoë Müller");
});

test("quotes a value containing a comma, a quote or a newline", () => {
  const csv = toCsv([{ note: 'He said "yes", then left\nlate' }]);
  expect(csv).toContain('"He said ""yes"", then left\nlate"');
});

test("a leading equals is defused so Excel does not run it", () => {
  expect(toCsv([{ name: "=1+1" }])).toContain("'=1+1");
});

test("null and undefined become empty cells, not the words", () => {
  const csv = toCsv([{ a: null, b: undefined, c: "x" }]);
  expect(csv).not.toContain("null");
  expect(csv).not.toContain("undefined");
  expect(csv.trimEnd().endsWith(",,x")).toBe(true);
});

test("an empty export is still a valid file", () => {
  expect(toCsv([])).toBe("﻿");
});
