import { cache } from "react";
import { TAGS, cached } from "@/lib/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@goodluck/db";
import { mediaAssets, partners } from "@goodluck/db/schema";
import { mediaUrl } from "@/lib/utils/media-url";

const listPartnerLogosUncached = cached(async (): Promise<string[]> => {
  const rows = await db
    .select({ kind: mediaAssets.kind, staticPath: mediaAssets.staticPath, cloudinaryPublicId: mediaAssets.cloudinaryPublicId })
    .from(partners)
    .leftJoin(mediaAssets, eq(partners.logoId, mediaAssets.id))
    .where(eq(partners.status, "published"))
    .orderBy(asc(partners.sortOrder));

  return rows.map((row) => mediaUrl(row, 240)).filter(Boolean);
}, ["partner-logos"], [TAGS.partners]);

export const listPartnerLogos = cache(listPartnerLogosUncached);
