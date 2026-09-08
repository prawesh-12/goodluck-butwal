import { cache } from "react";
import { db } from "@db/client";
import { uiStrings } from "@db/schema";

// One query per render, shared by every component that asks for a string.
const allStrings = cache(async () => {
  const rows = await db.select({ key: uiStrings.key, value: uiStrings.value }).from(uiStrings);
  return new Map(rows.map((row) => [row.key, row.value]));
});

export type Text = (key: string, fallback: string) => string;

// The fallback is passed in at the point of use, which means the wording in the code IS the
// default. An admin's edit overrides it; clearing their edit falls back here rather than showing
// a blank space, and no column is needed to remember what the default was.
export async function loadText(): Promise<Text> {
  const strings = await allStrings();
  return (key, fallback) => {
    const value = strings.get(key);
    return value && value.trim() ? value : fallback;
  };
}
