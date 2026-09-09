import { inArray, sql } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices, partners, teamMembers } from "@db/schema";
import { team } from "./source/team";
import { partnerLogos } from "./source/partners";

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

  const rows = team.map((person, index) => ({
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
  }));

  await db
    .insert(teamMembers)
    .values(rows)
    .onConflictDoUpdate({
      target: teamMembers.slug,
      set: {
        fullName: sql`excluded.full_name`,
        position: sql`excluded.position`,
        officeId: sql`excluded.office_id`,
        photoId: sql`excluded.photo_id`,
        isCoFounder: sql`excluded.is_co_founder`,
        status: sql`excluded.status`,
        publishedAt: sql`excluded.published_at`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: new Date(),
      },
    });
  return rows.length;
}

export async function seedPartners() {
  const media = await mediaIdByPath();

  const rows = partnerLogos.map((logo, index) => ({
    // The carousel shows no names, so the row is identified by its position.
    name: `Partner ${index + 1}`,
    logoId: media.get(logo) ?? null,
    status: "published" as const,
    publishedAt: new Date(),
    sortOrder: index,
  }));

  // partners.name carries no unique index, so there is nothing to upsert against. Reading the
  // existing names once splits the rows into one insert and one update.
  const names = rows.map((row) => row.name);
  const existing = new Map(
    (await db.select({ id: partners.id, name: partners.name }).from(partners).where(inArray(partners.name, names)))
      .map((row) => [row.name, row.id]),
  );

  const fresh = rows.filter((row) => !existing.has(row.name));
  if (fresh.length) await db.insert(partners).values(fresh);

  const known = rows.filter((row) => existing.has(row.name));
  if (known.length) {
    const pairs = sql.join(
      known.map((row) => sql`(${existing.get(row.name)}::uuid, ${row.logoId}::uuid, ${row.sortOrder}::int)`),
      sql`, `,
    );
    await db.execute(
      sql`update ${partners} set logo_id = v.logo_id, sort_order = v.sort_order, updated_at = now() from (values ${pairs}) as v(id, logo_id, sort_order) where ${partners.id} = v.id`,
    );
  }
  return rows.length;
}
