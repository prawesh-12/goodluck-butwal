import { cache } from "react";
import { db } from "./client";
import { settings } from "./schema";

// Read whole, once per render, and shared through cache(), same as the ui strings table.
export const allSettings = cache(async () => {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  return new Map(rows.map((row) => [row.key, row.value]));
});
