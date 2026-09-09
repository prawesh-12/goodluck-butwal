import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices, teamMembers } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";
import type { OfficeId } from "@/config/site";

export type PublicMember = {
  slug: string;
  name: string;
  role: string;
  office: OfficeId | null;
  photo: string;
};

export const listTeam = cache(async (): Promise<PublicMember[]> => {
  const rows = await db
    .select({
      slug: teamMembers.slug,
      name: teamMembers.fullName,
      role: teamMembers.position,
      office: offices.code,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(teamMembers)
    .leftJoin(offices, eq(teamMembers.officeId, offices.id))
    .leftJoin(mediaAssets, eq(teamMembers.photoId, mediaAssets.id))
    .where(eq(teamMembers.status, "published"))
    .orderBy(asc(teamMembers.sortOrder));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    role: row.role ?? "",
    office: (row.office as OfficeId | null) ?? null,
    photo: mediaUrl(row, 640),
  }));
});
