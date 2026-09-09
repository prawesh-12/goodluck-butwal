import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@db/client";
import { destinations, pages, services } from "@db/schema";
import { combine, pageOf, PAGE_SIZE, type ContentFilters } from "@/lib/utils/admin-query";

export async function listAdminPages(f: ContentFilters) {
  const where = combine([
    f.q ? or(ilike(pages.title, `%${f.q}%`), ilike(pages.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(pages.status, f.status as "draft") : undefined,
    f.parent ? eq(pages.parent, f.parent) : undefined,
  ]);
  const page = pageOf(f);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: pages.id,
        slug: pages.slug,
        parent: pages.parent,
        title: pages.title,
        status: pages.status,
        showInNav: pages.showInNav,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(where)
      .orderBy(asc(pages.parent), asc(pages.sortOrder))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(pages).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminPage(id: string) {
  const [row] = await db.select().from(pages).where(eq(pages.id, id));
  return row;
}

export async function slugsInUse(table: "pages" | "destinations" | "services", exceptId?: string) {
  const rows =
    table === "pages"
      ? await db.select({ id: pages.id, slug: pages.slug }).from(pages)
      : table === "destinations"
        ? await db.select({ id: destinations.id, slug: destinations.slug }).from(destinations)
        : await db.select({ id: services.id, slug: services.slug }).from(services);
  return rows.filter((row) => row.id !== exceptId).map((row) => row.slug);
}
