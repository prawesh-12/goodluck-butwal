import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { partners } from "@db/schema";
import { asStatus, PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";

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
      })
      .from(partners)
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
