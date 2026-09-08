import { NextResponse } from "next/server";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Feeds the media picker. Read-only, and it returns only what the picker renders.
export async function GET(request: Request) {
  const actor = await requireActor();
  if (!can(actor, "media", "read")) {
    return NextResponse.json({ ok: false, error: "Not your area." }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
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
    .where(like ? or(ilike(mediaAssets.filename, like), ilike(mediaAssets.altText, like)) : undefined)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(60);

  return NextResponse.json({ ok: true, data: rows });
}
