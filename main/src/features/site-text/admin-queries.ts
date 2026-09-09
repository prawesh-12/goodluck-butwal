import { like } from "drizzle-orm";
import { db } from "@db/client";
import { uiStrings } from "@db/schema";

export async function uiStringsFor(prefix: string) {
  const rows = await db
    .select({ key: uiStrings.key, value: uiStrings.value })
    .from(uiStrings)
    .where(like(uiStrings.key, `${prefix}%`));
  return new Map(rows.map((row) => [row.key, row.value]));
}
