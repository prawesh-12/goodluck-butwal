import { and, count, eq, gte } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@db/client";

const MAX_PER_HOUR = 3;

// Counted from the rows themselves, so there is no store to keep in sync and a restart cannot
// forget who has been submitting.
export async function overRateLimit(
  table: PgTable & { ipHash: AnyPgColumn; createdAt: AnyPgColumn },
  ipHash: string,
) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(table)
    .where(and(eq(table.ipHash, ipHash), gte(table.createdAt, hourAgo)));

  return row.n >= MAX_PER_HOUR;
}
