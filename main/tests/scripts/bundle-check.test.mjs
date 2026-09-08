import { test, expect } from "vitest";
import { parseGzipMb, LIMIT_MB } from "../../scripts/bundle-check.mjs";

test("reads the compressed size from wrangler output", () => {
  const output = "Total Upload: 6602.13 KiB / gzip: 1369.46 KiB\n--dry-run: exiting now.";
  expect(parseGzipMb(output).toFixed(2)).toBe("1.34");
});

test("returns null when wrangler printed no size", () => {
  expect(parseGzipMb("ERROR the entry-point file was not found")).toBe(null);
});

test("a bundle just over 2.50 MB breaches the limit", () => {
  expect(parseGzipMb("gzip: 2570.00 KiB")).toBeGreaterThan(LIMIT_MB);
});

test("a bundle just under 2.50 MB does not", () => {
  expect(parseGzipMb("gzip: 2550.00 KiB")).toBeLessThan(LIMIT_MB);
});
