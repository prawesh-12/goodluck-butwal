import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGzipMb, LIMIT_MB } from "../../scripts/bundle-check.mjs";

test("reads the compressed size from wrangler output", () => {
  const output = "Total Upload: 6602.13 KiB / gzip: 1369.46 KiB\n--dry-run: exiting now.";
  assert.equal(parseGzipMb(output).toFixed(2), "1.34");
});

test("returns null when wrangler printed no size", () => {
  assert.equal(parseGzipMb("ERROR the entry-point file was not found"), null);
});

test("a bundle just over 2.50 MB breaches the limit", () => {
  assert.ok(parseGzipMb("gzip: 2570.00 KiB") > LIMIT_MB);
});

test("a bundle just under 2.50 MB does not", () => {
  assert.ok(parseGzipMb("gzip: 2550.00 KiB") < LIMIT_MB);
});
