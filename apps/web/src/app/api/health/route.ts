import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@goodluck/db";

export const dynamic = "force-dynamic";

// The error is swallowed on purpose: a driver message carries the connection string.
export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { status: "ok", database: "up", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
