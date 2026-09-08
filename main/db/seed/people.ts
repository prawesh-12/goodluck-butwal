import { eq } from "drizzle-orm";
import { db } from "../client";
import { mediaAssets, offices, partners, teamMembers } from "../schema";
import { team } from "../../src/content/team";
import { partnerLogos } from "../../src/content/partners";

async function mediaIdByPath() {
  const rows = await db
    .select({ id: mediaAssets.id, path: mediaAssets.staticPath })
    .from(mediaAssets);
  return new Map(rows.map((row) => [row.path, row.id]));
}

async function officeIdByCode() {
  const rows = await db.select({ id: offices.id, code: offices.code }).from(offices);
  return new Map(rows.map((row) => [row.code, row.id]));
}

export async function seedTeam() {
  const media = await mediaIdByPath();
  const office = await officeIdByCode();

  for (const [index, person] of team.entries()) {
    const row = {
      slug: person.slug,
      fullName: person.name,
      position: person.role,
      officeId: person.office ? (office.get(person.office) ?? null) : null,
      photoId: media.get(person.photo) ?? null,
      // Bio, qualifications and expertise wait on the client, which is why /team/[slug] is later.
      isCoFounder: person.role.toLowerCase().includes("cofounder"),
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
    };

    await db
      .insert(teamMembers)
      .values(row)
      .onConflictDoUpdate({ target: teamMembers.slug, set: { ...row, updatedAt: new Date() } });
  }
  return team.length;
}

export async function seedPartners() {
  const media = await mediaIdByPath();

  for (const [index, logo] of partnerLogos.entries()) {
    const logoId = media.get(logo) ?? null;
    const existing = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.name, `Partner ${index + 1}`));

    const row = {
      // The carousel shows no names, so the row is identified by its position.
      name: `Partner ${index + 1}`,
      logoId,
      status: "published" as const,
      publishedAt: new Date(),
      sortOrder: index,
    };

    if (existing.length) {
      await db.update(partners).set({ ...row, updatedAt: new Date() }).where(eq(partners.id, existing[0].id));
    } else {
      await db.insert(partners).values(row);
    }
  }
  return partnerLogos.length;
}
