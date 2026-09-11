import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets } from "@goodluck/db/schema";
import { requireActor } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await requireActor();
  if (!can(actor, "media", "read")) {
    return NextResponse.json({ ok: false, error: "Not your area." }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const type = params.get("type")?.trim();
  const like = q ? `%${q}%` : undefined;

  const rows = await db
    .select({
      id: mediaAssets.id,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
      filename: mediaAssets.filename,
      altText: mediaAssets.altText,
    })
    .from(mediaAssets)
    .where(
      and(
        like ? or(ilike(mediaAssets.filename, like), ilike(mediaAssets.altText, like)) : undefined,
        type ? eq(mediaAssets.type, type) : undefined,
      ),
    )
    .orderBy(desc(mediaAssets.createdAt))
    .limit(60);

  return NextResponse.json({ ok: true, data: rows });
}
