import { cache } from "react";
import { db } from "@db/client";
import { settings, uiStrings } from "@db/schema";

// Six places used to read one of these two small tables, which meant six round trips on a page
// that needed one. Both are read whole, once per render, and shared through cache().
export const allUiStrings = cache(async () => {
  const rows = await db.select({ key: uiStrings.key, value: uiStrings.value }).from(uiStrings);
  return new Map(rows.map((row) => [row.key, row.value]));
});

export const allSettings = cache(async () => {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  return new Map(rows.map((row) => [row.key, row.value]));
});
