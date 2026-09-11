import { cache } from "react";
import { db } from "./client";
import { uiStrings } from "./schema";
import { TAGS, cached } from "@/lib/cache";

const rows = cached(
  () => db.select({ key: uiStrings.key, value: uiStrings.value }).from(uiStrings),
  ["ui-strings"],
  [TAGS.uiStrings],
);

// Read whole once per render and shared through cache(): six callers, one round trip. The Map is
// rebuilt here rather than stored, because the data cache only keeps what JSON can carry.
export const allUiStrings = cache(async () => {
  return new Map((await rows()).map((row) => [row.key, row.value]));
});
