import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets, offices } from "@db/schema";
import { type Actor } from "@/lib/auth/rbac";
import { asStatus, PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";

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

export async function officeOptions() {
  return db
    .select({ id: offices.id, name: offices.name })
    .from(offices)
    .orderBy(asc(offices.name));
}

export async function altTextByIds(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => Boolean(id));
  if (wanted.length === 0) return new Map<string, string | null>();

  const rows = await db
    .select({ id: mediaAssets.id, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, wanted));

  return new Map(rows.map((row) => [row.id, row.altText]));
}
