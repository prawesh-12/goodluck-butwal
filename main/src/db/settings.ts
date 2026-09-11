import { cache } from "react";
import { db } from "./client";
import { settings } from "./schema";
import { TAGS, cached } from "@/lib/cache";

const rows = cached(
  () => db.select({ key: settings.key, value: settings.value }).from(settings),
  ["settings"],
  [TAGS.settings],
);

// Read whole, once per render, and shared through cache(), same as the ui strings table.
export const allSettings = cache(async () => {
  return new Map((await rows()).map((row) => [row.key, row.value]));
});
