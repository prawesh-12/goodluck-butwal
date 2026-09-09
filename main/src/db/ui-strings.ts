import { cache } from "react";
import { db } from "./client";
import { uiStrings } from "./schema";

// Read whole, once per render, and shared through cache(): six places used to read this small
// table, which meant six round trips on a page that needed one.
export const allUiStrings = cache(async () => {
  const rows = await db.select({ key: uiStrings.key, value: uiStrings.value }).from(uiStrings);
  return new Map(rows.map((row) => [row.key, row.value]));
});
