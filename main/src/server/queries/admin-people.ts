import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices, partners, teamMembers } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/rbac";
import { contentStatuses } from "@/lib/validators/office";

export const PAGE_SIZE = 25;

export type AdminFilters = { q?: string; status?: string; office?: string; page?: number };

type Status = (typeof contentStatuses)[number];

const asStatus = (value?: string) =>
  contentStatuses.includes(value as Status) ? (value as Status) : undefined;

export async function altTextByIds(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => Boolean(id));
  if (wanted.length === 0) return new Map<string, string | null>();

  const rows = await db
    .select({ id: mediaAssets.id, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, wanted));

  return new Map(rows.map((row) => [row.id, row.altText]));
}

export async function officeOptions() {
  return db
    .select({ id: offices.id, name: offices.name, code: offices.code })
    .from(offices)
    .orderBy(asc(offices.name));
}

function officeWhere(actor: Actor, f: AdminFilters) {
  const parts: (SQL | undefined)[] = [];
  // An office row is its own office, so scope compares the row id, not an office_id column.
  if (actor.role !== "super_admin") {
    parts.push(actor.officeId ? eq(offices.id, actor.officeId) : sql`false`);
  }
  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(offices.name, like), ilike(offices.city, like), ilike(offices.country, like)));
  }
  const status = asStatus(f.status);
  if (status) parts.push(eq(offices.status, status));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminOffices(actor: Actor, f: AdminFilters) {
  const where = officeWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: offices.id,
        slug: offices.slug,
        name: offices.name,
        city: offices.city,
        country: offices.country,
        phoneDisplay: offices.phoneDisplay,
        status: offices.status,
        isActive: offices.isActive,
      })
      .from(offices)
      .where(where)
      .orderBy(asc(offices.sortOrder), asc(offices.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(offices).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminOffice(id: string) {
  const [row] = await db.select().from(offices).where(eq(offices.id, id));
  return row;
}

function teamWhere(actor: Actor, f: AdminFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(teamMembers, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(teamMembers.fullName, like), ilike(teamMembers.position, like)));
  }
  const status = asStatus(f.status);
  if (status) parts.push(eq(teamMembers.status, status));
  if (f.office) parts.push(eq(teamMembers.officeId, f.office));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminTeam(actor: Actor, f: AdminFilters) {
  const where = teamWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: teamMembers.id,
        slug: teamMembers.slug,
        fullName: teamMembers.fullName,
        position: teamMembers.position,
        status: teamMembers.status,
        sortOrder: teamMembers.sortOrder,
        officeId: teamMembers.officeId,
        office: offices.name,
      })
      .from(teamMembers)
      .leftJoin(offices, eq(teamMembers.officeId, offices.id))
      .where(where)
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.fullName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(teamMembers).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminTeamMember(id: string) {
  const [row] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
  return row;
}

export async function teamSlugs() {
  const rows = await db.select({ slug: teamMembers.slug }).from(teamMembers);
  return rows.map((row) => row.slug);
}

function partnerWhere(f: AdminFilters) {
  const parts: (SQL | undefined)[] = [];
  if (f.q) parts.push(ilike(partners.name, `%${f.q}%`));
  const status = asStatus(f.status);
  if (status) parts.push(eq(partners.status, status));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminPartners(f: AdminFilters) {
  const where = partnerWhere(f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: partners.id,
        name: partners.name,
        websiteUrl: partners.websiteUrl,
        status: partners.status,
        sortOrder: partners.sortOrder,
        isFeatured: partners.isFeatured,
        logo: mediaAssets.staticPath,
      })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoId, mediaAssets.id))
      .where(where)
      .orderBy(asc(partners.sortOrder), asc(partners.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(partners).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminPartner(id: string) {
  const [row] = await db.select().from(partners).where(eq(partners.id, id));
  return row;
}

export async function pickedMedia(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => Boolean(id));
  if (wanted.length === 0) return new Map<string, PickedRow>();

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
    .where(inArray(mediaAssets.id, wanted));

  return new Map(rows.map((row) => [row.id, row]));
}

type PickedRow = {
  id: string;
  kind: "static" | "cloudinary";
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
};
