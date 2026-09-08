import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices, partners, teamMembers } from "@db/schema";
import type { OfficeId } from "@/lib/site";

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
      photo: mediaAssets.staticPath,
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
    photo: row.photo ?? "",
  }));
});

export const listPartnerLogos = cache(async (): Promise<string[]> => {
  const rows = await db
    .select({ path: mediaAssets.staticPath })
    .from(partners)
    .leftJoin(mediaAssets, eq(partners.logoId, mediaAssets.id))
    .where(eq(partners.status, "published"))
    .orderBy(asc(partners.sortOrder));

  return rows.map((row) => row.path).filter((path): path is string => Boolean(path));
});
